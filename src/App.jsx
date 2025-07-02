import React, { useState } from 'react';
import { Layout } from 'antd';
import AppHeader from './components/AppHeader';
import CesiumViewer from './components/CesiumViewer';
import FloatingPanel from './components/FloatingPanel';
import './App.css';

const { Content } = Layout;

function App() {
  // 管理当前时间状态
  const [currentTime, setCurrentTime] = useState(new Date());
  // 管理阴影开关状态
  const [shadowsEnabled, setShadowsEnabled] = useState(true);
  // 管理3D Tiles类型状态
  const [tilesType, setTilesType] = useState('normal'); // 'normal' 或 'solar'
  // 管理底图类型状态
  const [baseMapType, setBaseMapType] = useState('satellite');
  // 管理Cesium viewer实例
  const [viewer, setViewer] = useState(null);

  // 处理时间变化
  const handleTimeChange = (newTime) => {
    setCurrentTime(newTime);
  };

  // 处理阴影开关变化
  const handleShadowsChange = (enabled) => {
    setShadowsEnabled(enabled);
  };

  // 处理3D Tiles类型切换
  const handleTilesTypeChange = (type) => {
    setTilesType(type);
    // 如果切换到太阳辐照模式，自动关闭阴影
    if (type === 'solar') {
      setShadowsEnabled(false);
    } else if (type === 'normal') {
      // 切换回普通模式时，重新显示阴影
      setShadowsEnabled(true);
    }
  };

  // 处理底图类型切换
  const handleBaseMapChange = (type) => {
    setBaseMapType(type);
  };

  // 处理viewer准备就绪
  const handleViewerReady = (viewerRef) => {
    setViewer(viewerRef);
  };

  // 处理tileset加载
  const handleTilesetLoad = (tileset) => {
    console.log('Tileset loaded:', tileset);
  };

  return (
    <Layout className="app-layout">
      <AppHeader 
        baseMapType={baseMapType}
        onBaseMapChange={handleBaseMapChange}
      />
      <Content className="app-content">
        <CesiumViewer 
          currentTime={currentTime}
          onTimeChange={handleTimeChange}
          shadowsEnabled={shadowsEnabled}
          onShadowsChange={handleShadowsChange}
          tilesType={tilesType}
          baseMapType={baseMapType}
          onViewerReady={handleViewerReady}
        />
        <FloatingPanel 
          viewer={viewer}
          onTilesetLoad={handleTilesetLoad}
          currentTime={currentTime}
          onTimeChange={handleTimeChange}
          shadowsEnabled={shadowsEnabled}
          onShadowsChange={handleShadowsChange}
          tilesType={tilesType}
          onTilesTypeChange={handleTilesTypeChange}
        />
      </Content>
    </Layout>
  );
}

export default App;