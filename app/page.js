'use client'; // 이 한 줄을 맨 위에 추가해주세요!

// app/page.js
// 이 부분은 파일을 읽어주는 역할을 하는 코드예요. 지우지 마세요!
import Image from "next/image"; // Next.js에서 이미지 쓰는 걸 도와주는 도구
import styles from "./page.module.css"; // 이 페이지의 스타일을 담고 있는 파일

// 이 부분이 실제 웹사이트에 보여질 내용을 만드는 코드예요.
export default function Home() {
  return (
    <>
      <p>
        {"현재 시각 오전 1시 1분...."}
      </p>
      <p>
        {"네트리파이로 서버 파고 도메인 연결에 ssl인증에 다 해버렸다.."}
      </p>
      <p>
        {낄낄낄}
      </p>
    </>
  );
}