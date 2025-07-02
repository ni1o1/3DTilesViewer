import React from 'react';
import { Layout, Typography, Space, Select } from 'antd';
import { GlobalOutlined, EnvironmentOutlined, SettingOutlined } from '@ant-design/icons';

const { Header } = Layout;
const { Title, Text } = Typography;

function AppHeader({ baseMapType = 'satellite', onBaseMapChange }) {
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
      
      <Space align="center">
        <SettingOutlined style={{ marginRight: 8 }} />
        <Select
          value={baseMapType}
          onChange={onBaseMapChange}
          style={{ width: 150 }}
          placeholder="选择底图"
          options={[

            { value: 'satellite', label: 'Satellite' },
            { value: 'osm', label: 'OpenStreetMap' },
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' }
          ]}
        />
      </Space>
    </Header>
  );
}

export default AppHeader;