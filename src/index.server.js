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
import rootReducer from './modules'
import PreloadContext from './lib/PreloadContext'

// asset-manifest.json 에서 파일 경로 조회
const manifest = JSON.parse(fs.readFileSync(path.resolve('./build/asset-manifest.json'), 'utf-8'))

// chunk.js 파일들의 경로를 이용하여 script 태그로 변환함
const chunks = Object.keys(manifest.files)
                .filter(key => /chunk\.js$/.exec(key))
                .map(key => `<script src="${manifest.files[key]}"></script>`)
                .join('')

function createPage(root, stateScript){
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <link rel="shortcut icon" href="/favicon.ico"/>
        <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no"/>
        <meta name="theme-color" content="#000000"/>
        <title>React App</title>
        <link href="${manifest.files["main.css"]}" rel="stylesheet"/>
      </head>
      <body>
        <noscript>You need to enable Javascript to run this app.</noscript>
        <div id="root">
          ${root}
        </div>
        ${stateScript}
        ${chunks}
        <script src="${manifest.files["main.js"]}"></script>
      </body>
    </html>
  `
}

const app = express()

const serverRender = async (req, res, next) => {
  const context = {}
  const store = createStore(rootReducer, applyMiddleware(thunk)) // 요청이 들어올때마다 스토어를 생성함

  const preloadContext = {
    done: false,
    promises: []
  }
  const jsx = (
    <PreloadContext.Provider value={preloadContext}>
      <Provider store={store}>
        <StaticRouter location={req.url} context={context}>
          <App/>
        </StaticRouter>
      </Provider>
    </PreloadContext.Provider>
  )
  ReactDOMServer.renderToStaticMarkup(jsx) // 초기 렌더링의 경우 정적 페이지만 보여줌 (API서버 호출)
  try{
    await Promise.all(preloadContext.promises) // 모든 API 서버 요청을 기다림
  }catch(e){
    return res.status(500)
  }
  preloadContext.done = true // API서버 호출이 완료되었음을 표시함 (API서버에 다시 요청을 보내지 않음)
  const root = ReactDOMServer.renderToString(jsx) // API서버 호출후 다시 렌더링을 수행함
  const stateString = JSON.stringify(store.getState()).replace(/</g, '\\u003c') // 서버에서 만든 스토어 상태를 브라우저에서 재사용하기 위함
  const stateScript = `<script>__PRELOADED_STATE__ = ${stateString}</script>`
  res.send(createPage(root, stateScript)) // html문서 (정적파일 포함)를 브라우저로 전송함
}

const serve = express.static(path.resolve('./build'), {
  index: false // "/" 경로에서 index.html 을 보여주지 않도록 설정함
})

app.use(serve) // static 미들웨어 설정 (정적파일 제공)
app.use(serverRender) // 서버사이드 렌더링

app.listen(5000, () => {
  console.log('Running on http://localhost:5000')
})

