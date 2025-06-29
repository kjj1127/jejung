'use client';
import './blog.css';
import { useState } from 'react';

function App() {

    let [글제목, 글제목변경] = useState(['남자코트 추천', '강남 우동 맛집', '파이썬 독학']);
    let [따봉, 따봉변경] = useState(new Array(글제목.length).fill(0));
    let copy따봉 = [...따봉];
    let [postno, setPostno] = useState(0);
    let [userInput, userInputValue] = useState('');
    let copy글제목 = [...글제목];
    // 모달 현재 상태 (default)
    let [modal, setModal] = useState(false);



    return (
        <div className="App">
            <div className="black-nav">
                <h4>jejung blog</h4>
            </div>

            {/* <div className="list">
                <h4>{글제목[0]} <span onClick={() => { 따봉변경(따봉 + 1) }}>👍{따봉}</span></h4>
                <p>2월 17일 발행</p>
            </div>
            <div className="list">
                <h4>{글제목[1]}</h4>
                <p>2월 17일 발행</p>
            </div>
            <div className="list">
                <h4 onClick={() => { setModal(!modal) }}>{글제목[2]}</h4>
                <p>2월 17일 발행</p>
            </div> */}

            {
                글제목.map(function(a, i) {
                    return (
                        <div className="list" key={i}>
                            <div className="title-area">
                                <h4 onClick={() => { setModal(!modal); setPostno(i) }}>{글제목[i]}</h4><span onClick={() => { copy따봉[i] = copy따봉[i] + 1; 따봉변경(copy따봉) }}>👍{따봉[i]}</span>
                            </div>
                            <p>2월 17일 발행</p>
                            <button onClick={()=>{copy글제목.splice(i,1); 글제목변경(copy글제목); copy따봉.splice(i,1); 따봉변경(copy따봉);}}>삭제</button>
                        </div>
                    )
                })
            }

            <input id="userText" type="text" onChange={(e)=>{ userInputValue(e.target.value)}} value={userInput}/>
            <button onClick={() => {copy글제목.unshift(userInput); 글제목변경(copy글제목); copy따봉.unshift(0);따봉변경(copy따봉); userInputValue('');}}>추가</button>

            {
                //상위 html로 퍼지는 이벤트버블링 막고싶으면 e.stopPropagation() 자식요소에 넣으면 됨

                // 조건식 ? 참일때 실행 할 코드 : 거짓일 때 실행할 코드
                // 1 == 1 ? '맞음' : '아님" -> 맞음
                // 1 == 2 ? '맞음' : '아님" -> 아님
                modal == true ? <Modal 글제목 = {글제목} postno = {postno} 글제목변경 = {글제목변경}/> : null
            }
        </div>
    )
}

function Modal(props){
    return(
        <div className="modal">
            <h4>{props.글제목[props.postno]}</h4>
            <p>내용</p>
            <p>상세내용</p>
        </div>
    )
}

export default App;