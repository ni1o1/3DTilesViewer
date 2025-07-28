import { useState, useEffect } from 'react';
import {  Row, Col, Tag, Collapse, Typography, Space, Spin } from 'antd';

const { Panel } = Collapse;
const { Text } = Typography;

// GLB文件解析器
class GLBAnalyzer {
  static async analyzeGLB(arrayBuffer) {
    try {
      const dataView = new DataView(arrayBuffer);
      
      // 检查文件大小
      if (arrayBuffer.byteLength < 12) {
        throw new Error('文件太小，不是有效的GLB文件');
      }
      
      // 检查GLB魔数
      const magic = dataView.getUint32(0, true);
      if (magic !== 0x46546C67) { // "glTF"
        throw new Error('不是有效的GLB文件（魔数不匹配）');
      }

      const version = dataView.getUint32(4, true);
      const length = dataView.getUint32(8, true);

      if (version !== 2) {
        throw new Error(`不支持的glTF版本: ${version}，仅支持版本2`);
      }

      let offset = 12;
      let jsonChunk = null;
      let binaryChunk = null;

      // 读取chunks
      while (offset < length) {
        if (offset + 8 > length) {
          break; // 防止读取越界
        }
        
        const chunkLength = dataView.getUint32(offset, true);
        const chunkType = dataView.getUint32(offset + 4, true);
        
        if (offset + 8 + chunkLength > length) {
          console.warn('Chunk长度超出文件范围，停止解析');
          break;
        }
        
        if (chunkType === 0x4E4F534A) { // "JSON"
          const jsonData = new Uint8Array(arrayBuffer, offset + 8, chunkLength);
          const jsonString = new TextDecoder().decode(jsonData);
          jsonChunk = JSON.parse(jsonString);
        } else if (chunkType === 0x004E4942) { // "BIN\0"
          binaryChunk = new Uint8Array(arrayBuffer, offset + 8, chunkLength);
        }
        
        offset += 8 + chunkLength;
      }

      if (!jsonChunk) {
        throw new Error('未找到JSON chunk');
      }

      return {
        version,
        length,
        jsonChunk,
        binaryChunk,
        binarySize: binaryChunk ? binaryChunk.length : 0
      };
    } catch (error) {
      console.error('GLB analysis failed:', error);
      throw error;
    }
  }

  static async analyzeGLTF(text) {
    try {
      const gltf = JSON.parse(text);
      return {
        version: 2,
        length: text.length,
        jsonChunk: gltf,
        binaryChunk: null,
        binarySize: 0
      };
    } catch (error) {
      console.error('glTF analysis failed:', error);
      throw error;
    }
  }

  static extractGLTFInfo(gltf) {
    const info = {
      asset: gltf.asset || {},
      scenes: gltf.scenes ? gltf.scenes.length : 0,
      nodes: gltf.nodes ? gltf.nodes.length : 0,
      meshes: gltf.meshes ? gltf.meshes.length : 0,
      materials: gltf.materials ? gltf.materials.length : 0,
      textures: gltf.textures ? gltf.textures.length : 0,
      images: gltf.images ? gltf.images.length : 0,
      accessors: gltf.accessors ? gltf.accessors.length : 0,
      bufferViews: gltf.bufferViews ? gltf.bufferViews.length : 0,
      buffers: gltf.buffers ? gltf.buffers.length : 0,
      animations: gltf.animations ? gltf.animations.length : 0,
      skins: gltf.skins ? gltf.skins.length : 0,
      cameras: gltf.cameras ? gltf.cameras.length : 0,
      extensions: gltf.extensions || {},
      extensionsUsed: gltf.extensionsUsed || [],
      extensionsRequired: gltf.extensionsRequired || []
    };

    return info;
  }
}

function GLBInfoInline({ glbData, visible }) {
  const [glbInfo, setGlbInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible && glbData) {
      analyzeGLBData();
    }
  }, [glbData, visible]);

  const analyzeGLBData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 如果glbData已经是分析结果，直接使用
      if (glbData.jsonChunk) {
        const gltfInfo = GLBAnalyzer.extractGLTFInfo(glbData.jsonChunk);
        setGlbInfo({
          ...glbData,
          gltfInfo
        });
      } else {
        // 兼容旧的ArrayBuffer格式
        const analysis = await GLBAnalyzer.analyzeGLB(glbData);
        const gltfInfo = GLBAnalyzer.extractGLTFInfo(analysis.jsonChunk);
        
        setGlbInfo({
          ...analysis,
          gltfInfo
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getExtensionDescription = (ext) => {
    const descriptions = {
      'KHR_draco_mesh_compression': 'Draco几何压缩',
      'KHR_texture_transform': '纹理变换',
      'KHR_materials_pbrSpecularGlossiness': 'PBR镜面光泽度材质',
      'KHR_materials_unlit': '无光照材质',
      'KHR_materials_clearcoat': '清漆材质',
      'KHR_materials_transmission': '透射材质',
      'KHR_materials_volume': '体积材质',
      'KHR_materials_ior': '折射率材质',
      'KHR_materials_specular': '镜面材质',
      'KHR_materials_sheen': '光泽材质',
      'KHR_mesh_quantization': '网格量化',
      'KHR_texture_basisu': 'Basis Universal纹理',
      'EXT_meshopt_compression': 'Meshopt压缩',
      'EXT_texture_webp': 'WebP纹理',
      'MSFT_texture_dds': 'DDS纹理',
      'KHR_lights_punctual': '点光源',
      'KHR_xmp_json_ld': 'XMP元数据'
    };
    return descriptions[ext] || ext;
  };

  if (!visible || !glbData) {
    return null;
  }

  if (loading) {
    return (
      <div style={{ 
        padding: '12px', 
        background: '#f8f9fa', 
        border: '1px solid #e9ecef',
        borderTop: 'none',
        borderRadius: '0 0 4px 4px'
      }}>
        <Spin size="small" />
        <Text style={{ marginLeft: '8px', fontSize: '12px' }}>正在分析GLB文件...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '12px', 
        background: '#fff2f0', 
        border: '1px solid #ffccc7',
        borderTop: 'none',
        borderRadius: '0 0 4px 4px'
      }}>
        <Text type="danger" style={{ fontSize: '12px' }}>分析失败: {error}</Text>
      </div>
    );
  }

  if (!glbInfo) {
    return null;
  }

  const { gltfInfo } = glbInfo;

  return (
    <div style={{ 
      background: '#f8f9fa', 
      border: '1px solid #e9ecef',
      borderTop: 'none',
      borderRadius: '0 0 4px 4px',
      padding: '12px'
    }}>
      <Collapse size="small" ghost defaultActiveKey={['basic', 'extensions']}>
        <Panel 
          header={<Text style={{ fontSize: '12px' }}>基本信息</Text>} 
          key="basic"
        >
          <div style={{ fontSize: '11px' }}>
            <Row gutter={[8, 4]}>
              <Col span={8}><Text type="secondary">glTF版本:</Text></Col>
              <Col span={16}><Text>{gltfInfo.asset.version || 'Unknown'}</Text></Col>
            </Row>
          </div>
        </Panel>

        {gltfInfo.extensionsUsed.length > 0 && (
          <Panel 
            header={
              <Space>
                <Text style={{ fontSize: '12px' }}>使用的扩展</Text>
                <Tag color="blue" size="small">{gltfInfo.extensionsUsed.length}</Tag>
              </Space>
            } 
            key="extensions"
          >
            <div style={{ fontSize: '11px' }}>
              {gltfInfo.extensionsUsed.map((ext, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>
                  <Tag size="small" color="blue">{ext}</Tag>
                  <Text type="secondary" style={{ fontSize: '10px', marginLeft: '4px' }}>
                    {getExtensionDescription(ext)}
                  </Text>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </Collapse>
    </div>
  );
}

export { GLBAnalyzer, GLBInfoInline };
export default GLBInfoInline;