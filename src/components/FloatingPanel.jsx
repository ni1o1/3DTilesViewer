import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Space, Upload, message, Typography, List, Divider } from 'antd';
import {
  UpOutlined,
  DownOutlined,
  InboxOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  QuestionCircleOutlined // 新增图标用于信息提示
} from '@ant-design/icons';
import * as Cesium from 'cesium';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

// 国际化文本常量
const messages = {
  en: {
    panelTitle: '3D Tiles Management',
    collapse: 'Collapse',
    expand: 'Expand',
    uploadDragText: 'Click or drag folder to upload 3D Tiles',
    uploadHint: 'Please upload a 3D Tiles folder containing a `tileset.json` file.',
    loadedTilesetsTitle: 'Loaded 3D Tiles',
    flyTo: 'Fly to Tileset',
    hide: 'Hide',
    show: 'Show',
    remove: 'Remove Tileset',
    files: 'files',
    viewerNotInit: 'Cesium viewer not initialized.',
    noTilesetJson: (folderName) => `No tileset.json found in folder "${folderName}".`,
    failedLoadFolder: (folderName, errorMsg) => `Failed to load folder "${folderName}": ${errorMsg}`,
    rootTilesetProcessFailed: (fileName) => `Root tileset.json file "${fileName}" could not be processed. Loading aborted.`,
    loadSuccess: (name) => `Successfully loaded 3D Tiles: ${name} `,
    loadFailed: (errorMsg) => `Failed to load 3D Tileset: ${errorMsg}`,
    tilesetRemoved: '3D Tiles removed successfully.',
    infoTitle: 'What are 3D Tiles?',
    infoDescription: `3D Tiles is an open standard for streaming massive heterogeneous 3D geospatial datasets. It defines a spatial data structure and a set of tile formats designed for streaming, rendering, and interacting with large 3D content, such as photogrammetry, 3D models, BIM/CAD, point clouds, and instanced 3D objects.`,
    learnMore: 'Learn more about 3D Tiles (OGC Standard)'
  },
  zh: {
    panelTitle: '3D Tiles 管理',
    collapse: '收起',
    expand: '展开',
    uploadDragText: '点击或拖拽上传 3D Tiles 文件夹',
    uploadHint: '请上传包含 `tileset.json` 文件的 3D Tiles 文件夹。',
    loadedTilesetsTitle: '已加载的 3D Tiles',
    flyTo: '定位到瓦片集',
    hide: '隐藏',
    show: '显示',
    remove: '移除瓦片集',
    files: '个文件',
    viewerNotInit: 'Cesium 视图未初始化。',
    noTilesetJson: (folderName) => `在文件夹 "${folderName}" 中未找到 tileset.json。`,
    failedLoadFolder: (folderName, errorMsg) => `加载文件夹 "${folderName}" 失败: ${errorMsg}`,
    rootTilesetProcessFailed: (fileName) => `根 tileset.json 文件 "${fileName}" 无法处理，加载中止。`,
    loadSuccess: (name) => `成功加载 3D Tiles: ${name}`,
    loadFailed: (errorMsg) => `加载 3D Tileset 失败: ${errorMsg}`,
    tilesetRemoved: '已成功移除 3D Tiles。',
    infoTitle: '什么是 3D Tiles？',
    infoDescription: `3D Tiles 是一种开放标准，用于传输大规模异构三维地理空间数据集。它定义了一种空间数据结构和一套瓦片格式，旨在用于流式传输、渲染和处理大型三维内容，例如摄影测量模型、三维模型、BIM/CAD、点云和实例化三维对象。`,
    learnMore: '了解更多 3D Tiles (OGC 标准)'
  }
};

function FloatingPanel({ viewer, onTilesetLoad }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [uploadedTilesets, setUploadedTilesets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tilesetVisibility, setTilesetVisibility] = useState({});
  const [showTilesetInfo, setShowTilesetInfo] = useState(false); // 控制信息显示
  const processedFileUIDs = useRef(new Set());
  const [lang, setLang] = useState('en'); // 默认语言

  // 检测浏览器语言
  useEffect(() => {
    const userLang = navigator.language || navigator.userLanguage;
    if (userLang.startsWith('zh')) {
      setLang('zh');
    } else {
      setLang('en');
    }
  }, []);

  const t = (key, ...args) => {
    const message = messages[lang][key];
    if (typeof message === 'function') {
      return message(...args);
    }
    return message;
  };

  const handleUpload = async (info) => {
    const { fileList } = info;
    if (fileList.some(f => f.status === 'uploading')) {
      setLoading(true);
    } else {
      setLoading(false);
    }
    const allFinished = fileList.every(f => f.status === 'done' || f.status === 'error');
    if (allFinished) {
      const newSuccessfulFiles = fileList.filter(f =>
        f.status === 'done' && !processedFileUIDs.current.has(f.uid)
      );
      if (newSuccessfulFiles.length > 0) {
        const filesByFolder = newSuccessfulFiles.reduce((acc, f) => {
          const folderName = f.originFileObj.webkitRelativePath.split('/')[0] || 'unknown_folder';
          if (!acc[folderName]) {
            acc[folderName] = [];
          }
          acc[folderName].push(f);
          return acc;
        }, {});
        for (const folderName in filesByFolder) {
          const filesForThisFolder = filesByFolder[folderName];
          try {
            await processUploadedFiles(filesForThisFolder, folderName);
            filesForThisFolder.forEach(f => processedFileUIDs.current.add(f.uid));
          } catch (error) {
            console.error(t('failedLoadFolder', folderName, error.message));
            message.error(t('failedLoadFolder', folderName, error.message));
          }
        }
      }
    }
  };

  const processUploadedFiles = async (fileList, folderName) => {
    const jsonFiles = fileList.filter(file => file.name.endsWith('tileset.json'));
    if (jsonFiles.length === 0) {
      throw new Error(t('noTilesetJson', folderName));
    }
    jsonFiles.sort((a, b) => a.originFileObj.webkitRelativePath.length - b.originFileObj.webkitRelativePath.length);
    const rootTilesetFile = jsonFiles[0];
    console.log(`Found entry tileset.json: ${rootTilesetFile.originFileObj.webkitRelativePath}`);
    await loadTileset(rootTilesetFile, fileList, folderName);
  };

  const loadTileset = async (rootTilesetFile, allFiles, folderName) => {
    if (!viewer?.current) {
      message.error(t('viewerNotInit'));
      return;
    }

    const fileMapByPath = new Map();
    const allGeneratedUrls = new Set();

    allFiles.forEach(file => {
      const fileObj = file.originFileObj || file;
      const url = URL.createObjectURL(fileObj);
      allGeneratedUrls.add(url);

      const fullPath = fileObj.webkitRelativePath;
      if (fullPath) {
        fileMapByPath.set(fullPath, { file: fileObj, url: url });
      }
    });

    const processedJsonCache = new Map();

    const processJsonRecursively = async (jsonRelativePath) => {
      if (processedJsonCache.has(jsonRelativePath)) {
        return processedJsonCache.get(jsonRelativePath);
      }

      const fileData = fileMapByPath.get(jsonRelativePath);

      if (!fileData || !fileData.file) {
        console.warn(`Skipping child tileset: Referenced JSON not found in uploaded files: ${jsonRelativePath}`);
        return null;
      }

      const jsonText = await fileData.file.text();
      const jsonObj = JSON.parse(jsonText);

      const currentJsonDir = jsonRelativePath.includes('/')
        ? jsonRelativePath.substring(0, jsonRelativePath.lastIndexOf('/') + 1)
        : '';

      const traverseAndUpdate = async (node) => {
        if (!node) return;

        if (node.content && node.content.uri) {
          const originalUri = node.content.uri;

          const resolvedUriPathEncoded = new URL(originalUri, `file:///${currentJsonDir}`).pathname.substring(1);
          const resolvedUriPath = decodeURIComponent(resolvedUriPathEncoded);

          if (originalUri.endsWith('.json')) {
            const newUri = await processJsonRecursively(resolvedUriPath);
            node.content.uri = newUri || "";
          } else {
            const resourceData = fileMapByPath.get(resolvedUriPath);
            if (resourceData) {
              node.content.uri = resourceData.url;
            } else {
              console.warn(`Skipping tile: Resource not found in uploaded files: ${resolvedUriPath}`);
              node.content.uri = "";
            }
          }
        }

        if (node.children && Array.isArray(node.children)) {
          for (const child of node.children) {
            await traverseAndUpdate(child);
          }
        }
      };

      if (jsonObj.root) {
        await traverseAndUpdate(jsonObj.root);
      }

      const modifiedJsonBlob = new Blob([JSON.stringify(jsonObj)], { type: 'application/json' });
      const newJsonUrl = URL.createObjectURL(modifiedJsonBlob);
      allGeneratedUrls.add(newJsonUrl);

      processedJsonCache.set(jsonRelativePath, newJsonUrl);
      return newJsonUrl;
    };

    try {
      const rootTilesetPath = rootTilesetFile.originFileObj.webkitRelativePath;
      const finalTilesetUrl = await processJsonRecursively(rootTilesetPath);

      if (!finalTilesetUrl) {
        message.error(t('rootTilesetProcessFailed', rootTilesetFile.name));
        return;
      }

      const tileset = await Cesium.Cesium3DTileset.fromUrl(finalTilesetUrl, {
        maximumScreenSpaceError: 16,
        maximumMemoryUsage: 512,
        skipRequestHeaders: true
      });

      const primitive = viewer.current.scene.primitives.add(tileset);

      await viewer.current.zoomTo(tileset);

      const newTileset = {
        id: Date.now().toString(),
        name: folderName,
        primitive: primitive,
        generatedUrls: allGeneratedUrls,
        fileCount: allFiles.length
      };

      setUploadedTilesets(prev => [...prev, newTileset]);
      setTilesetVisibility(prev => ({ ...prev, [newTileset.id]: true }));
      message.success(t('loadSuccess', newTileset.name));

      if (onTilesetLoad) {
        onTilesetLoad(newTileset);
      }

    } catch (error) {
      console.error('Failed to load 3D Tileset:', error);
      message.error(t('loadFailed', error.message));
      allGeneratedUrls.forEach(url => URL.revokeObjectURL(url));
      throw error;
    }
  };

  const removeTileset = (tilesetId) => {
    const tilesetToRemove = uploadedTilesets.find(t => t.id === tilesetId);
    if (!tilesetToRemove) return;
    if (viewer?.current && !tilesetToRemove.primitive.isDestroyed()) {
      viewer.current.scene.primitives.remove(tilesetToRemove.primitive);
    }
    if (tilesetToRemove.generatedUrls) {
      tilesetToRemove.generatedUrls.forEach(url => URL.revokeObjectURL(url));
    }
    setUploadedTilesets(prev => prev.filter(t => t.id !== tilesetId));
    setTilesetVisibility(prev => {
      const newVisibility = { ...prev };
      delete newVisibility[tilesetId];
      return newVisibility;
    });
    message.success(t('tilesetRemoved'));
  };

  const flyToTileset = (tilesetId) => {
    const tilesetToFly = uploadedTilesets.find(t => t.id === tilesetId);
    if (tilesetToFly && viewer?.current) {
      viewer.current.zoomTo(tilesetToFly.primitive);
    }
  };

  const toggleTilesetVisibility = (tilesetId) => {
    const tileset = uploadedTilesets.find(t => t.id === tilesetId);
    if (tileset && viewer?.current) {
      const isVisible = !tilesetVisibility[tilesetId];
      tileset.primitive.show = isVisible;
      setTilesetVisibility(prev => ({ ...prev, [tilesetId]: isVisible }));
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    directory: true, // Crucial for uploading folders
    showUploadList: false,
    beforeUpload: () => true,
    customRequest: ({ onSuccess }) => setTimeout(() => onSuccess(), 0), // Mock upload
    onChange: handleUpload,
  };

  return (
    <div
      className="floating-panel"
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        width: isCollapsed ? '280px' : '520px',
        background: '#fffffff2',
        backdropFilter: 'blur(10px)',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)',
        zIndex: 1000,
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <span>{t('panelTitle')}</span>

            </Space>
            <Button
              type="text"
              size="small"
              icon={isCollapsed ? <DownOutlined /> : <UpOutlined />}
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? t('expand') : t('collapse')}
              style={{ color: '#666', fontSize: '12px' }}
            />
          </div>
        }
        size="small"
        style={{ border: 'none' }}
      >
        {!isCollapsed && (
          <div>
            <Dragger {...uploadProps} style={{ marginBottom: '16px' }}>
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">{t('uploadDragText')}</p>
              <p className="ant-upload-hint">{t('uploadHint')}</p>
            </Dragger>



            {uploadedTilesets.length > 0 && (
              <div>
                <Divider></Divider>
                <Paragraph type="secondary" style={{ margin: '16px 0 8px 0' }}><Text strong>{t('loadedTilesetsTitle')} ({uploadedTilesets.length}):</Text></Paragraph>
                <List
                  size="small"
                  dataSource={uploadedTilesets}
                  renderItem={(tileset) => (
                    <List.Item
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #f0f0f0',
                        borderRadius: '4px',
                        marginBottom: '4px',
                        background: '#fafafa'
                      }}
                      actions={[
                        <Button type="text" size="small" icon={<EnvironmentOutlined />} onClick={() => flyToTileset(tileset.id)} title={t('flyTo')} />,
                        <Button type="text" size="small" icon={tilesetVisibility[tileset.id] ? <EyeOutlined /> : <EyeInvisibleOutlined />} onClick={() => toggleTilesetVisibility(tileset.id)} title={tilesetVisibility[tileset.id] ? t('hide') : t('show')} />,
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeTileset(tileset.id)} title={t('remove')} />
                      ]}
                    >
                      <List.Item.Meta
                        title={<Text strong style={{ fontSize: '13px' }}>{tileset.name}</Text>}
                        description={<Text type="secondary" style={{ fontSize: '11px' }}>{tileset.fileCount} {t('files')}</Text>}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
            <Divider></Divider>
            <Paragraph type="secondary" style={{ fontSize: '12px', marginBottom: '0px' }}>
              <Text strong>{t('infoTitle')}</Text>
              <br />
              {t('infoDescription')}
              <br />
              <a href="https://www.ogc.org/standards/3DTiles/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px' }}>{t('learnMore')}</a>
            </Paragraph>
          </div>
        )}
      </Card>
    </div>
  );
}

export default FloatingPanel;