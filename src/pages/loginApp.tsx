// import '@ant-design/v5-patch-for-react-19';
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { LoginForm, ProConfigProvider, ProFormCheckbox, ProFormText } from "@ant-design/pro-components";
import { theme, Space, ConfigProvider } from "antd";
import ruRU from 'antd/locale/ru_RU';
import React from 'react';
import { Navigate } from 'react-router';
import { axiosPublic } from '../common/httpPublic';

const Login: React.FC = () => {
  const { token } = theme.useToken();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const authOn = () => setIsAuthenticated(true);

  if (isAuthenticated) return <Navigate replace to="/" />;

  return (
    <ConfigProvider locale={ruRU} theme={{ algorithm: theme.defaultAlgorithm }}>
      <ProConfigProvider hashed={false}>
        <div style={{ backgroundColor: token.colorBgBase }}>
          <LoginForm
            logo="../../public/favicon.svg"
            subTitle="Leo4 Control center"
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
                });
                console.log(response.data);
                authOn(); // Авторизация успешна
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