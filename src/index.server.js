import ReactDOMServer from 'react-dom/server'
import express from 'express'
import { StaticRouter } from 'react-router-dom'
import App from './App'
import path from 'path'
import fs from 'fs'

// 리덕스 설정
import { legacy_createStore as createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import PreloadContext from './lib/PreloadContext'

// 리덕스 사가 설정
import createSagaMiddleware from '@redux-saga/core'
import rootReducer, { rootSaga } from './modules';
import { END } from 'redux-saga'

// Loadable Components 적용
import { ChunkExtractor, ChunkExtractorManager } from '@loadable/server'

const statsFile = path.resolve('./build/loadable-stats.json')

// asset-manifest.json 에서 파일 경로 조회
const manifest = JSON.parse(fs.readFileSync(path.resolve('./build/asset-manifest.json'), 'utf-8'))

// chunk.js 파일들의 경로를 이용하여 script 태그로 변환함
const chunks = Object.keys(manifest.files)
                .filter(key => /chunk\.js$/.exec(key))
                .map(key => `<script src="${manifest.files[key]}"></script>`)
                .join('')

function createPage(root, tags){
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <link rel="shortcut icon" href="/favicon.ico"/>
        <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no"/>
        <meta name="theme-color" content="#000000"/>
        <title>React App</title>
        ${tags.styles}
        ${tags.links}
      </head>
      <body>
        <noscript>You need to enable Javascript to run this app.</noscript>
        <div id="root">
          ${root}
        </div>
        ${tags.scripts}
      </body>
    </html>
  `
}

const app = express()

const serverRender = async (req, res, next) => {
  const context = {}
  const sagaMiddleware = createSagaMiddleware()
  const store = createStore(rootReducer, applyMiddleware(thunk, sagaMiddleware)) // 요청이 들어올때마다 스토어를 생성함

  const sagaPromise = sagaMiddleware.run(rootSaga).toPromise()

  const preloadContext = {
    done: false,
    promises: []
  }

  // 코드스플리팅에 필요한 파일 경로를 추출하기 위한 ChunkExtractor 함수
  const extractor = new ChunkExtractor({ statsFile }) 

  // ChunkExtractorManager : 어떤 컴포넌트가 렌더링될때 어느 chunk 파일을 읽어와야 하는지 경로들을 extractor 로 넣어줌
  const jsx = (
    <ChunkExtractorManager extractor={extractor}>
      <PreloadContext.Provider value={preloadContext}>
        <Provider store={store}>
          <StaticRouter location={req.url} context={context}>
            <App/>
          </StaticRouter>
        </Provider>
      </PreloadContext.Provider>
    </ChunkExtractorManager>
  )
  ReactDOMServer.renderToStaticMarkup(jsx) // 초기 렌더링의 경우 정적 페이지만 보여줌 (API서버 호출) - Preloader 컴포넌트에서 API 호출함
  store.dispatch(END) // END 액션을 디스패치하면 액션을 모니터링하는 모든 사가들이 종료됨 (API서버 호출을 더이상 못하도록 막아버림)
  
  // 서버사이드렌더링이란 ? API 서버에서 데이터 요청해서 가져온 다음 해당 데이터로 HTML 문서를 미리 만들어서 브라우저에 전달함
  try{
    await sagaPromise // 기존에 진행중인 사가들이 종료될때까지 기다림 (API 요청이 끝날때가지 기다림)
    await Promise.all(preloadContext.promises) // 모든 API 서버 요청을 기다림
  }catch(e){
    return res.status(500)
  }

  // 여기서부터는 API서버에서 가져온 데이터가 리덕스 스토어에 존재하므로 해당 데이터로 렌더링함

  preloadContext.done = true // API서버 호출이 완료되었음을 표시함 (API서버에 다시 요청을 보내지 않음)
  const root = ReactDOMServer.renderToString(jsx) // API서버에서 가져온 데이터로 다시 렌더링을 수행함
  const stateString = JSON.stringify(store.getState()).replace(/</g, '\\u003c') // 서버에서 만든 스토어 상태를 브라우저에서 재사용하기 위함
  const stateScript = `<script>__PRELOADED_STATE__ = ${stateString}</script>`
  
  const tags = {
    scripts: stateScript + extractor.getScriptTags(), // stateScript : 리덕스 상태를 조회하기 위함
    links: extractor.getLinkTags(),
    styles: extractor.getStyleTags()
  }
  
  res.send(createPage(root, tags)) // html문서 (정적파일 포함)를 브라우저로 전송함
}

const serve = express.static(path.resolve('./build'), {
  index: false // "/" 경로에서 index.html 을 보여주지 않도록 설정함
})

app.use(serve) // static 미들웨어 설정 (정적파일 제공)
app.use(serverRender) // 서버사이드 렌더링

app.listen(5000, () => {
  console.log('Running on http://localhost:5000')
})

