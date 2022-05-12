import { useEffect } from "react";
import Users from "../components/Users";
import { connect } from "react-redux";
import { getUsers } from "../modules/users";
import { Preloader } from "../lib/PreloadContext";

const UsersContainer = ({ users, getUsers }) => {
  // 서버사이드 렌더링의 경우 useEffect 가 실행되지 않기 때문에 Preloader 컴포넌트를 이용하여 API서버를 호출함
  useEffect(() => {
    if(users) return // 이미 서버에서 데이터를 받아와서 값이 있으면 다시 서버에 요청하지 않음 
    getUsers()
  }, [getUsers, users])
  return (
    <>
      <Users users={users}/> {/* 리렌더링시 API서버에서 가져온 users 데이터를 이용하여 렌더링함 */}
      <Preloader resolve={getUsers}/> {/* API서버 호출 (초기 렌더링시 한번만 실행됨, 리렌더링시에는 실행되지 않음)  */}
    </>
  )
}

export default connect(
  state => ({
    users: state.users.users 
  }),
  {
    getUsers
  }
)(UsersContainer)