// import '@ant-design/v5-patch-for-react-19';
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { LoginForm, ProConfigProvider, ProFormCheckbox, ProFormText, createIntl } from "@ant-design/pro-components";
import { theme, Space, ConfigProvider } from "antd";
import ruRU from 'antd/locale/ru_RU';
import ruRUPro from '@ant-design/pro-provider/lib/locale/ru_RU';
import React, { useState } from 'react';
import { Navigate } from 'react-router';
import { axiosPublic } from '../common/httpPublic';
import { config } from '../common/config';
import { SmartCaptcha } from '@yandex/smart-captcha';

// Создаём intl для pro-components
const ruRUIntl = createIntl('ru_RU', ruRUPro);

const Login: React.FC = () => {
  console.log("Login: rendering");
  const { token } = theme.useToken();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const authOn = () => setIsAuthenticated(true);

  console.log("Login: isAuthenticated =", isAuthenticated);

  if (isAuthenticated) return <Navigate replace to="/" />;

  return (
    <ConfigProvider locale={ruRU} theme={{ algorithm: theme.defaultAlgorithm }}>
      <ProConfigProvider hashed={false} intl={ruRUIntl}>
        <div style={{ backgroundColor: token.colorBgBase }}>
          <LoginForm
            logo="/favicon.svg"
            subTitle="Leo4 Control center"
            submitter={{
              submitButtonProps: {
                children: 'Войти',
              },
            }}
            actions={<Space />}
            onFinish={async (values) => {
              const { username, password } = values;
              
              // ✅ Замена Buffer на btoa для Base64-кодирования
              const encodedCredentials = btoa(`${username}:${password}`);
              
              console.log(values, encodedCredentials);
              
              try {
                // Проверяем, что капча пройдена
                if (!captchaToken) {
                  console.error('Капча не пройдена');
                  return;
                }

                // Отправляем запрос с Basic Auth
                // Токены приходят в httpOnly cookies - браузер автоматически их сохранит
                await axiosPublic.get('/login/', {
                  headers: {
                    Authorization: `Basic ${encodedCredentials}`,
                    'Smart-Captcha-Token': captchaToken,
                  },
                  withCredentials: true,  // Важно: принимать cookies от сервера
                });
                
                console.log("Login successful - tokens in httpOnly cookies");
                authOn();
              } catch (error) {
                console.error('Login failed:', error);
                // Капча остаётся как есть, пользователь может обновить страницу
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
                  strengthText:
                    'Пароль должен содержать цифры, буквы и спецсимволы, не менее 8 символов.',
                  statusRender: (value) => {
                    const getStatus = () => {
                      if (value && value.length > 12) return 'ok';
                      if (value && value.length > 6) return 'pass';
                      return 'poor';
                    };
                    const status = getStatus();
                    if (status === 'pass') {
                      return (
                        <div style={{ color: token.colorWarning }}>
                          Качество：Нормальное
                        </div>
                      );
                    }
                    if (status === 'ok') {
                      return (
                        <div style={{ color: token.colorSuccess }}>
                          Качество：Отличное
                        </div>
                      );
                    }
                    return (
                      <div style={{ color: token.colorError }}>
                        Качество：Слабое
                      </div>
                    );
                  },
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
              <a
                style={{
                  float: 'right',
                }}
              >
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
      </ProConfigProvider>
    </ConfigProvider>
  );
};

export default Login;
