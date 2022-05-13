import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import User from '../components/User'
import { usePreloader } from "../lib/PreloadContext";
import { getUser } from '../modules/users'

const UserContainer = ({ id }) => { // id : 사용자가 요청한 id (조회하려는 사용자 ID 값)
  const user = useSelector(state => state.users.user) // 현재 스토어 상태 조회
  const dispatch = useDispatch() // dispatch 함수 반환하는 리액트 훅

  usePreloader(() => dispatch(getUser(id))) // 서버사이드렌더링을 위한 API서버 호출 (커스텀훅 사용)
  
  // 클라이언트사이드렌더링에는 useEffect 훅에서 API서버 호출함
  useEffect(() => {
    if(user && user.id === parseInt(id, 10)) return // 사용자가 이미 존재하고, 요청한 id 값이 현재 사용자 ID 와 일치하면 서버에 재요청할 필요가 없음
    dispatch(getUser(id)) // API서버 호출
  }, [dispatch, id, user]) // id 가 바뀔때마다 새로 요청해야 함 

  if(!user){ // null 을 반환하는 대신 서버사이드렌더링을 위하여 Preloader 컴포넌트로 API서버를 호출함
    return null // 이미 usePreloader 로 API서버 호출해서 스토어의 user 상태를 변경하고 UserContainer 컴포넌트를 리렌더링하기 때문에 렌더링할때 user 는 무조건 존재함
  }
  return <User user={user}/>
}

export default UserContainer