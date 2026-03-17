// import '@ant-design/v5-patch-for-react-19';
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { LoginForm, ProConfigProvider, ProFormCheckbox, ProFormText, createIntl } from "@ant-design/pro-components";
import { theme, Space, ConfigProvider } from "antd";
import ruRU from 'antd/locale/ru_RU';
import ruRUPro from '@ant-design/pro-provider/lib/locale/ru_RU';
import React from 'react';
import { Navigate } from 'react-router';
import { axiosPublic } from '../common/httpPublic';
import { setApiKey } from '../common/httpPrivate';

// Создаём intl для pro-components
const ruRUIntl = createIntl('ru_RU', ruRUPro);

const Login: React.FC = () => {
  console.log("Login: rendering");
  const { token } = theme.useToken();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
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
                const response = await axiosPublic.get('/login/', {
                  headers: {
                    Authorization: `Basic ${encodedCredentials}`,
                  },
                  withCredentials: true,  // Важно: получать cookies
                });
                console.log("Login response:", response.data);
                
                // Токены приходят в response.data (JSON)
                // Также проверяем cookies как резервный вариант
                const cookies = document.cookie;
                console.log("Cookies:", cookies);
                
                // Сначала пробуем получить токен из ответа API
                let token = response.data?.accessToken || response.data?.token || response.data?.api_key || '';
                console.log("Token from response:", token);
                
                // Если нет в response - ищем в cookies (разные возможные имена)
                if (!token) {
                  const cookieMatch = cookies.match(/token=([^;]+)/) || 
                                     cookies.match(/accessToken=([^;]+)/) ||
                                     cookies.match(/api_key=([^;]+)/);
                  if (cookieMatch) {
                    token = cookieMatch[1];
                    console.log("Token from cookie:", token);
                  }
                }
                
                if (token) {
                  // Сохраняем токен под разными ключами для совместимости
                  setApiKey(token);
                  localStorage.setItem('accessToken', token);  // Для Authorization header
                  console.log("Token saved to localStorage");
                } else {
                  console.error("No token found!", { cookies, responseData: response.data });
                }
                authOn();
              } catch (error) {
                console.error('Login failed:', error);
                // Можно добавить отображение ошибки пользователю
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
          </LoginForm>
        </div>
      </ProConfigProvider>
    </ConfigProvider>
  );
};

export default Login;