import { useEffect, useState } from 'react';
import type { FC } from 'react';
import {
  Drawer,
  Tabs,
  Input,
  Button,
  Table,
  Checkbox,
  Tag,
  Alert,
  Space,
  Divider,
  Typography,
  Grid,
} from 'antd';
import { SearchOutlined, SettingOutlined } from '@ant-design/icons';
import type { AmapPoi, AutoFillField } from '../services/autofill/types';
import { searchHotels, getAmapKey, saveAmapKey } from '../services/autofill/amap';
import { classify } from '../services/autofill/classify';
import { parseHotelText } from '../services/autofill/pasteParser';

const { Text } = Typography;

interface AutoFillDrawerProps {
  open: boolean;
  defaultKeyword: string;
  initialTab?: 'map' | 'paste';
  onClose: () => void;
  onApply: (fields: AutoFillField[]) => void;
}

type EditableField = AutoFillField & { checked: boolean };

function confidenceTag(confidence: string) {
  const map: Record<string, { color: string; text: string }> = {
    high: { color: 'green', text: '高' },
    medium: { color: 'orange', text: '中' },
    low: { color: 'red', text: '低' },
  };
  const item = map[confidence] || { color: 'default', text: confidence };
  return <Tag color={item.color}>{item.text}</Tag>;
}

function toEditable(fields: AutoFillField[]): EditableField[] {
  return fields.map((f) => ({ ...f, checked: f.confidence !== 'low' }));
}

const AutoFillDrawer: FC<AutoFillDrawerProps> = ({ open, defaultKeyword, initialTab = 'map', onClose, onApply }) => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [activeTab, setActiveTab] = useState(initialTab);

  const [amapKey, setAmapKey] = useState(getAmapKey());
  const [keyEditing, setKeyEditing] = useState(false);

  const [keyword, setKeyword] = useState(defaultKeyword);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState('');
  const [pois, setPois] = useState<AmapPoi[]>([]);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [mapFields, setMapFields] = useState<EditableField[]>([]);
  const [mapWarnings, setMapWarnings] = useState<string[]>([]);

  const [pasteText, setPasteText] = useState('');
  const [pasteFields, setPasteFields] = useState<EditableField[]>([]);
  const [pasteWarnings, setPasteWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setKeyword(defaultKeyword || '');
      setActiveTab(initialTab);
    }
  }, [open, defaultKeyword, initialTab]);

  const handleMapSearch = async () => {
    setMapError('');
    setMapWarnings([]);
    setPois([]);
    setMapFields([]);
    setSelectedPoiId(null);
    setMapLoading(true);
    try {
      const results = await searchHotels(keyword, getAmapKey());
      if (results.length === 0) {
        setMapError('未找到匹配的酒店，请尝试输入更完整的名称。');
      }
      setPois(results);
    } catch (e) {
      setMapError(e instanceof Error ? e.message : '联网识别失败');
    } finally {
      setMapLoading(false);
    }
  };

  const handleSelectPoi = (poi: AmapPoi) => {
    setSelectedPoiId(poi.id || poi.name);
    const result = classify(poi);
    setMapFields(toEditable(result.fields));
    setMapWarnings(result.warnings);
  };

  const handlePasteParse = () => {
    const result = parseHotelText(pasteText);
    setPasteFields(toEditable(result.fields));
    setPasteWarnings(result.warnings);
  };

  const updateFieldValue = (
    setter: React.Dispatch<React.SetStateAction<EditableField[]>>,
    key: string,
    value: string,
  ) => {
    setter((prev) => prev.map((f) => (f.key === key ? { ...f, value } : f)));
  };

  const toggleChecked = (
    setter: React.Dispatch<React.SetStateAction<EditableField[]>>,
    key: string,
    checked: boolean,
  ) => {
    setter((prev) => prev.map((f) => (f.key === key ? { ...f, checked } : f)));
  };

  const applyFields = (fields: EditableField[]) => {
    const selected = fields.filter((f) => f.checked);
    if (selected.length === 0) return;
    onApply(selected.map(({ checked: _checked, ...rest }) => rest));
    onClose();
  };

  const fieldColumns = (
    setter: React.Dispatch<React.SetStateAction<EditableField[]>>,
  ) => [
    {
      title: '采用',
      key: 'checked',
      width: 60,
      render: (_: unknown, record: EditableField) => (
        <Checkbox
          checked={record.checked}
          onChange={(e) => toggleChecked(setter, record.key, e.target.checked)}
        />
      ),
    },
    { title: '字段', dataIndex: 'label', key: 'label', width: 110 },
    {
      title: '值（可编辑）',
      key: 'value',
      render: (_: unknown, record: EditableField) => (
        <Input
          value={String(record.value)}
          onChange={(e) => updateFieldValue(setter, record.key, e.target.value)}
          size="small"
        />
      ),
    },
    {
      title: '置信度',
      key: 'confidence',
      width: 80,
      render: (_: unknown, record: EditableField) => confidenceTag(record.confidence),
    },
    { title: '来源', dataIndex: 'source', key: 'source', width: 120 },
  ];

  const poiColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true },
    { title: '类型', dataIndex: 'type', key: 'type', width: 160, ellipsis: true },
  ];

  return (
    <Drawer
      title="智能填充"
      width={isMobile ? '100%' : 720}
      open={open}
      onClose={onClose}
      extra={
        <Button
          icon={<SettingOutlined />}
          onClick={() => setKeyEditing((v) => !v)}
        >
          设置 Key
        </Button>
      }
    >
      {keyEditing && (
        <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 6 }}>
          <Text type="secondary">高德地图 Web端(JS API) Key：</Text>
          <Space.Compact style={{ width: '100%', marginTop: 8 }}>
            <Input.Password
              value={amapKey}
              onChange={(e) => setAmapKey(e.target.value)}
              placeholder="粘贴高德 Key（需绑定当前域名）"
            />
            <Button
              type="primary"
              onClick={() => {
                saveAmapKey(amapKey);
                setKeyEditing(false);
              }}
            >
              保存
            </Button>
          </Space.Compact>
          <Text type="secondary" style={{ fontSize: 12 }}>
            前端 Key 会公开，请在高德控制台绑定域名 gordon310.github.io（本地开发加 localhost）。
          </Text>
        </div>
      )}

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'map' | 'paste')}
        items={[
          {
            key: 'map',
            label: '联网识别（高德）',
            children: (
              <div>
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="输入酒店名称，如：上海外滩茂悦大酒店"
                    onPressEnter={handleMapSearch}
                  />
                  <Button type="primary" icon={<SearchOutlined />} loading={mapLoading} onClick={handleMapSearch}>
                    搜索
                  </Button>
                </Space.Compact>

                {mapError && <Alert style={{ marginTop: 12 }} type="warning" showIcon message={mapError} />}

                {pois.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Text strong>选择正确的酒店：</Text>
                    <Table
                      rowKey={(r) => r.id || r.name}
                      columns={poiColumns}
                      dataSource={pois}
                      size="small"
                      pagination={false}
                      scroll={{ x: 'max-content' }}
                      style={{ marginTop: 8 }}
                      rowSelection={{
                        type: 'radio',
                        selectedRowKeys: selectedPoiId ? [selectedPoiId] : [],
                        onChange: (_keys, rows) => handleSelectPoi(rows[0]),
                      }}
                      onRow={(record) => ({ onClick: () => handleSelectPoi(record) })}
                    />
                  </div>
                )}

                {mapFields.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Divider titlePlacement="start">识别结果（请核对后应用）</Divider>
                    {mapWarnings.map((w) => (
                      <Alert key={w} type="info" showIcon message={w} style={{ marginBottom: 8 }} />
                    ))}
                    <Table
                      rowKey="key"
                      columns={fieldColumns(setMapFields)}
                      dataSource={mapFields}
                      size="small"
                      pagination={false}
                      scroll={{ x: 'max-content' }}
                    />
                    <Button
                      type="primary"
                      style={{ marginTop: 12 }}
                      onClick={() => applyFields(mapFields)}
                    >
                      应用选中项
                    </Button>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'paste',
            label: '粘贴解析',
            children: (
              <div>
                <Text type="secondary">
                  从携程等页面复制可见文字，粘贴到下方，自动抽取字段（不联网、不抓取）。
                </Text>
                <Input.TextArea
                  rows={8}
                  style={{ marginTop: 8 }}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={'示例：\n上海外滩茂悦大酒店\n客房数：320 间\n开业时间：2018年6月\n建筑面积：42000 平方米\n均价：￥1250'}
                />
                <Button type="primary" style={{ marginTop: 8 }} onClick={handlePasteParse}>
                  解析
                </Button>

                {pasteWarnings.map((w) => (
                  <Alert key={w} type="warning" showIcon message={w} style={{ marginTop: 12 }} />
                ))}

                {pasteFields.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Divider titlePlacement="start">解析结果（请核对后应用）</Divider>
                    <Table
                      rowKey="key"
                      columns={[
                        ...fieldColumns(setPasteFields),
                        { title: '原文片段', dataIndex: 'snippet', key: 'snippet', ellipsis: true, width: 200 },
                      ]}
                      dataSource={pasteFields}
                      size="small"
                      pagination={false}
                      scroll={{ x: 'max-content' }}
                    />
                    <Button
                      type="primary"
                      style={{ marginTop: 12 }}
                      onClick={() => applyFields(pasteFields)}
                    >
                      应用选中项
                    </Button>
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
};

export default AutoFillDrawer;
