import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { legacy_createStore as createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import createSagaMiddleware from '@redux-saga/core';
import rootReducer, { rootSaga } from './modules';
import { loadableReady } from '@loadable/component';

const sagaMiddleware = createSagaMiddleware()

const store = createStore(rootReducer, window.__PRELOADED_STATE__, applyMiddleware(thunk, sagaMiddleware))

sagaMiddleware.run(rootSaga)

// 컴포넌트 재사용을 위하여 Root 컴포넌트를 만듦
const Root = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  )
}

const rootEl = document.getElementById('root')
const root = ReactDOM.createRoot(rootEl);

// Production 환경에서는 loadableReady 와 hydrate 을 사용하고 개발환경에서는 기존방식으로 처리함
if(process.env.NODE_ENV === 'production'){
  loadableReady(() => {  // 모든 스크립트가 로딩된 이후에 렌더링하도록 처리하기 위함
    ReactDOM.hydrateRoot(<Root/>, root) // hydrateRoot : 서버사이드렌더링으로 이미 UI가 존재하는 경우 새로 렌더링하지 않고 기존 UI에 이벤트만 연동하여 성능을 최적화함
  })
}else{
  root.render(
    <Root/>
  );
}


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
