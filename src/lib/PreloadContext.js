import { createContext, useContext } from "react";

// 클라이언트 환경: null
// 서버 환경 : { done: false, promises: [] }
const PreloadContext = createContext(null)
export default PreloadContext

// preloadContext : { done, promises }
export const Preloader = ({ resolve }) => { // resolve: getUsers 함수
  const preloadContext = useContext(PreloadContext)
  if(!preloadContext) return null
  if(preloadContext.done) return null // 이미 작업이 끝난 경우

  preloadContext.promises.push(Promise.resolve(resolve())) // API서버 호출 이후에 해당 프로미스를 추가함
  return null 
}

// Hook 형태로 사용되는 API서버 호출 함수
export const usePreloader = resolve => {
  const preloadContext = useContext(PreloadContext)
  if(!preloadContext) return null
  if(preloadContext.done) return null // 이미 작업이 끝난 경우
  preloadContext.promises.push(Promise.resolve(resolve()))
}