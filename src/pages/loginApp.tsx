import '@ant-design/v5-patch-for-react-19';
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { LoginForm, ProConfigProvider, ProFormCheckbox, ProFormText } from "@ant-design/pro-components";
import { theme, Space, ConfigProvider} from "antd";
import {Buffer} from 'buffer';
import ruRU from 'antd/locale/ru_RU';
import axios from 'axios';
import React from 'react';
import { Navigate } from 'react-router';

const Login: React.FC = () => {
    const { token } = theme.useToken();
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const authOn = () => setIsAuthenticated(true);
    if (isAuthenticated) return (<>{ <Navigate replace to="/" />}</>);

    return (
        <ConfigProvider
            //   locale={loc_en},
            theme={{algorithm: theme.defaultAlgorithm,}}
             locale={ruRU}>
    <ProConfigProvider hashed={false} >
      <div style={{ backgroundColor: token.colorBgBase}}>
        <LoginForm
          logo="../../public/favicon.svg"
        //   title="Leo4"
          subTitle="Leo4 Control center"
          actions={ <Space></Space> }
          onFinish={ async (values ) => {
            const { username, password } = values;
            const encodedToken = Buffer.from(`${username}:${password}`).toString('base64');
            console.log(values, encodedToken);
            const response = await axios.get('https://dev.leo4.ru/account/login/', { headers: { 
               'Content-Type': 'application/json','Authorization': 'Basic '+ encodedToken} })
            console.log(response.data);
            authOn();
          }}
        >
            <>
              <ProFormText
                name="username"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className={'prefixIcon'} />,
                }}
                placeholder={'Имя пользователя'}
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
                  prefix: <LockOutlined className={'prefixIcon'} />,
                  strengthText:
                    'Password should contain numbers, letters and special characters, at least 8 characters long.',
                  statusRender: (value) => {
                    const getStatus = () => {
                      if (value && value.length > 12) {
                        return 'ok';
                      }
                      if (value && value.length > 6) {
                        return 'pass';
                      }
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
                      <div style={{ color: token.colorError }}>Качество：Слабое</div>
                    );
                  },
                }}
                placeholder={'Пароль'}
                rules={[
                  {
                    required: true,
                    message: 'Password required!',
                  },
                ]}
              />
            </>
           {/* )} */}
          {/* {loginType === 'phone' && (
            <>
              <ProFormText
                fieldProps={{
                  size: 'large',
                  prefix: <MobileOutlined className={'prefixIcon'} />,
                }}
                name="mobile"
                placeholder={'手机号'}
                rules={[
                  {
                    required: true,
                    message: '请输入手机号！',
                  },
                  {
                    pattern: /^1\d{10}$/,
                    message: '手机号格式错误！',
                  },
                ]}
              />
              <ProFormCaptcha
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className={'prefixIcon'} />,
                }}
                captchaProps={{
                  size: 'large',
                }}
                placeholder={'请输入验证码'}
                captchaTextRender={(timing, count) => {
                  if (timing) {
                    return `${count} ${'获取验证码'}`;
                  }
                  return '获取验证码';
                }}
                name="captcha"
                rules={[
                  {
                    required: true,
                    message: '请输入验证码！',
                  },
                ]}
                onGetCaptcha={async () => {
                  message.success('获取验证码成功！验证码为：1234');
                }}
              />
            </>
          )} */}
          <div
            style={{
              marginBlockEnd: 24,
            }}
          >
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
}
export default Login