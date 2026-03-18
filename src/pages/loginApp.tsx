// import '@ant-design/v5-patch-for-react-19';
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { LoginForm, ProFormCheckbox, ProFormText } from "@ant-design/pro-components";
import { Space } from "antd";
import React, { useState } from 'react';
import { Navigate } from 'react-router';
import { axiosPublic } from '../common/httpPublic';
import { config } from '../common/config';
import { SmartCaptcha } from '@yandex/smart-captcha';

const Login: React.FC = () => {
  console.log("Login: rendering");
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const authOn = () => setIsAuthenticated(true);

  console.log("Login: isAuthenticated =", isAuthenticated);

  if (isAuthenticated) return <Navigate replace to="/" />;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ 
        background: '#fff', 
        padding: '40px', 
        borderRadius: '8px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/favicon.svg" alt="Logo" style={{ width: '64px', height: '64px' }} />
          <h1 style={{ marginTop: '16px', marginBottom: '8px', fontSize: '24px', color: '#333' }}>
            Leo4 Control Center
          </h1>
        </div>
        <LoginForm
          submitter={{
            submitButtonProps: {
              children: 'Войти',
              style: { width: '100%' }
            },
          }}
          actions={<Space />}
          onFinish={async (values) => {
            const { username, password } = values;
            
            // Замена Buffer на btoa для Base64-кодирования
            const encodedCredentials = btoa(`${username}:${password}`);
            
            console.log(values, encodedCredentials);
            
            try {
              // Проверяем, что капча пройдена
              if (!captchaToken) {
                console.error('Капча не пройдена');
                return;
              }

              // Отправляем запрос с Basic Auth
              await axiosPublic.get('/login/', {
                headers: {
                  Authorization: `Basic ${encodedCredentials}`,
                  'Smart-Captcha-Token': captchaToken,
                },
                withCredentials: true,
              });
              
              console.log("Login successful - tokens in httpOnly cookies");
              authOn();
            } catch (error) {
              console.error('Login failed:', error);
            }
          }}
        >
          <>
            <ProFormText
              name="username"
              fieldProps={{
                size: 'large',
                prefix: <UserOutlined className="prefixIcon" />,
              }}
              placeholder="Имя пользователя"
              rules={[
                {
                  required: true,
                  message: 'Обязательное поле!',
                },
              ]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined className="prefixIcon" />,
              }}
              placeholder="Пароль"
              rules={[
                {
                  required: true,
                  message: 'Пароль обязателен!',
                },
              ]}
            />
          </>
          <div style={{ marginBlockEnd: 24 }}>
            <ProFormCheckbox noStyle name="autoLogin">
              Принять условия
            </ProFormCheckbox>
            <a style={{ float: 'right' }}>
              Оферта
            </a>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <SmartCaptcha
                sitekey={config.captchaSitekey}
                onSuccess={setCaptchaToken}
                language="ru"
                test={config.captchaTestMode}
              />
            </div>
          </div>
        </LoginForm>
      </div>
    </div>
  );
};

export default Login;
