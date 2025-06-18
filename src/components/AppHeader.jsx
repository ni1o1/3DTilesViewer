import React from 'react';
import { Layout, Typography, Space } from 'antd';
import { GlobalOutlined, EnvironmentOutlined } from '@ant-design/icons';

const { Header } = Layout;
const { Title, Text } = Typography;

function AppHeader() {
  return (
    <Header style={{
      background: '#ffffff',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid #f0f0f0' // 添加一个底部边框以区分内容
    }}>
      <Space align="center">

        <div style={{ display: 'flex', alignItems: 'center' }}>
            <h3 style={{ margin: 0, marginRight: '50px' }}>3DTiles Viewer</h3>
          </div>
      </Space>
    </Header>
  );
}

export default AppHeader;