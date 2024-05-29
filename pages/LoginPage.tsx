"use client";
// LoginPage.tsx

import React, { useState } from 'react';

// Define the prop types for LoginPage
interface LoginPageProps {
  onLoginSuccess: () => void; // Function that takes no arguments and returns void
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    let errorMessage = '输入信息有误！'; // 默认错误消息
    if (response.status === 401) {
      errorMessage = '无效的用户名或密码'; // 特定错误
    } else if (response.status === 500) {
      errorMessage = '服务器错误，请稍后重试'; // 另一种特定错误
    }
    setError(errorMessage);
    return;
  }

  const data = await response.json();

    if (data.success) {
    // 成功登录后，首先获取UserID
    const fetchUserIDResponse = await fetch('/api/recordInteraction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'fetchUserID',
        username: username,
      }),
    });

    if (fetchUserIDResponse.ok) {
      const { UserID } = await fetchUserIDResponse.json();

      // 记录登录到数据库
      const loginTime = new Date().toISOString();
      await fetch('/api/recordInteraction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'insertInteraction',
          UserID: UserID,
          ButtonName: "User Login",
          UserLogTime: loginTime,
          GPTMessages: "User logged in",
          Note: `userlogged in at ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`
        }),
      });
      // sessionStorage.setItem('jwtToken', data.token); // 保存 token
      // 重定向用户
      // const baseUrl = "https://umn.qualtrics.com/jfe/form/SV_8H23ajkfHQ9rYJo";
      // window.location.href = `${baseUrl}?url=${data.redirect}&token=${data.token}&UserID=${UserID}&CID=${data.CID}`;
      window.location.href = `${data.redirect}?token=${data.token}`;
    } else {
      setError('Failed to fetch user ID');
    }
  } else {
    setError('Invalid username or password');
  }
};




  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <div>{error}</div>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;
