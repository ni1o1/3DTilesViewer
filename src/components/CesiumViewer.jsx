import React, { useRef, useEffect } from 'react';
import * as Cesium from 'cesium';
import { message } from 'antd';

// 设置Cesium的默认访问令牌（如果需要）
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2MjFjMThmZC03MjEzLTQzZTctYWM3Ny1iZTdiMTdjOTBmMmUiLCJpZCI6MTU2MjcwLCJpYXQiOjE3NTE0NTAzNjV9.p53JdDijMD3hFfypyhe8ysowC-JETMwFVH87SW7ukG4';

function CesiumViewer({ currentTime, onTimeChange, shadowsEnabled = true, onShadowsChange, tilesType = 'normal', onViewerReady }) {
  const cesiumContainer = useRef(null);
  const viewer = useRef(null);


  useEffect(() => {
    if (!cesiumContainer.current) return;

    try {
      // 创建Cesium viewer
      viewer.current = new Cesium.Viewer(cesiumContainer.current, {
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        timeline: false,
        animation: false,
        homeButton: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        vrButton: false,
        geocoder: false,
        infoBox: true,
        selectionIndicator: true,
        // 隐藏Cesium Ion logo
        creditContainer: document.createElement('div')
      });

      // 移除Cesium Ion的信用信息显示
      viewer.current.cesiumWidget.creditContainer.style.display = 'none';

      // 设置初始视角
      viewer.current.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(114.1794890659453, 22.301170000048663, 8000000), 
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-65),
          roll: 0.0
        }
      });
      

      
      // 如果传入了初始时间，设置时钟
      if (currentTime) {
        viewer.current.clock.currentTime = Cesium.JulianDate.fromDate(currentTime);
        viewer.current.clock.shouldAnimate = false;
      }
      
      // 通知父组件viewer已准备就绪
      if (onViewerReady) {
        onViewerReady(viewer);
      }
      
    } catch (error) {
      console.error('初始化Cesium viewer失败:', error);
      message.error('地图初始化失败');
    }

    // 清理函数
    return () => {
      if (viewer.current) {
        viewer.current.destroy();
        viewer.current = null;
      }
    };
  }, []);


  return (
    <div 
      ref={cesiumContainer} 
      className="cesium-container"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default CesiumViewer;