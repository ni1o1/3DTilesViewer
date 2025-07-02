import React, { useRef, useEffect } from 'react';
import * as Cesium from 'cesium';
import { message } from 'antd';

// 设置Cesium的默认访问令牌（从环境变量读取）
Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN

function CesiumViewer({ currentTime, onTimeChange, shadowsEnabled = true, onShadowsChange, tilesType = 'normal', baseMapType = 'satellite', onViewerReady }) {
  const cesiumContainer = useRef(null);
  const viewer = useRef(null);


  useEffect(() => {
    if (!cesiumContainer.current) return;

    try {
      // 创建Cesium viewer
      viewer.current = new Cesium.Viewer(cesiumContainer.current, {
        imageryProvider: false, // 禁止默认的Bing Maps
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
      
      // 设置初始底图
      changeBaseMap(baseMapType);
      
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

  // 底图切换函数
  const changeBaseMap = async (mapType) => {
    if (!viewer.current) return;

    const imageryLayers = viewer.current.imageryLayers;
    imageryLayers.removeAll();

    let imageryProvider;
    
    switch (mapType) {
      case 'satellite':
        imageryProvider = await Cesium.createWorldImageryAsync();
        break;
      case 'osm':
        imageryProvider = new Cesium.OpenStreetMapImageryProvider({
          url: 'https://a.tile.openstreetmap.org/'
        });
        break;
      case 'dark':
        imageryProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
          subdomains: ['a', 'b', 'c', 'd']
        });
        break;
      case 'light':
        imageryProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
          subdomains: ['a', 'b', 'c', 'd']
        });
        break;
      default:
        imageryProvider = await Cesium.createWorldImageryAsync();
    }

    if (imageryProvider) {
      imageryLayers.addImageryProvider(imageryProvider);
    }
  };

  // 监听底图类型变化
  useEffect(() => {
    if (viewer.current) {
      changeBaseMap(baseMapType);
    }
  }, [baseMapType]);


  return (
    <div 
      ref={cesiumContainer} 
      className="cesium-container"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default CesiumViewer;