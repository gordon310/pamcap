import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { Form, Input, InputNumber, Select, DatePicker, Button, Card, Row, Col, Divider, Space, App as AntApp } from 'antd';
import type { FormProps } from 'antd';
import { SearchOutlined, SnippetsOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ValuationInput } from '../types';
import type { AutoFillField } from '../services/autofill/types';
import { percentToRatio } from '../utils/units';
import AutoFillDrawer from './AutoFillDrawer';
import { useStore } from '../stores';

const { Option } = Select;

interface InputFormProps {
  onSubmit: (values: ValuationInput) => void;
}

const NUMERIC_KEYS = ['rooms', 'gfa', 'ctrip_adr', 'owner_ebitda', 'other_income', 'equity', 'construction_cost', 'acquisition_price', 'original_cost', 'renovation_cost', 'land_price_per_sqm', 'construction_cost_per_sqm', 'actual_transaction_price'];

const InputForm: FC<InputFormProps> = ({ onSubmit }) => {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'map' | 'paste'>('map');
  const [drawerKeyword, setDrawerKeyword] = useState('');
  const storeInput = useStore((s) => s.input);
  const lastLoadedId = useRef<string | null>(null);

  useEffect(() => {
    if (!storeInput) return;
    const id = JSON.stringify(storeInput);
    if (id === lastLoadedId.current) return;
    lastLoadedId.current = id;
    const vals: Record<string, any> = { ...storeInput };
    if (vals.opening_date) vals.opening_date = dayjs(String(vals.opening_date));
    form.setFieldsValue(vals);
  }, [storeInput, form]);

  const openDrawer = (tab: 'map' | 'paste') => {
    setDrawerKeyword(String(form.getFieldValue('hotel_name') || ''));
    setDrawerTab(tab);
    setDrawerOpen(true);
  };

  const handleAutoFillApply = (fields: AutoFillField[]) => {
    const values: Record<string, unknown> = {};
    fields.forEach((f) => {
      if (f.key === 'opening_date') {
        const parsed = dayjs(String(f.value));
        if (parsed.isValid()) values[f.key] = parsed;
      } else if (NUMERIC_KEYS.includes(f.key)) {
        const n = Number(String(f.value).replace(/,/g, ''));
        if (!Number.isNaN(n)) values[f.key] = n;
      } else {
        values[f.key] = f.value;
      }
    });
    form.setFieldsValue(values);
  };

  const onFinish = (values: any) => {
    // Process the form values to match the ValuationInput interface
    const processedValues: ValuationInput = {
      hotel_name: values.hotel_name,
      rooms: values.rooms,
      opening_date: values.opening_date.format('YYYY-MM-DD'),
      gfa: values.gfa,
      city_tier: values.city_tier,
      location: values.location,
      segment: values.segment,
      property_type: values.property_type,
      operation_mode: values.operation_mode,
      ctrip_adr: values.ctrip_adr,
      occupancy_input: percentToRatio(values.occupancy_input),
      fb_ratio: percentToRatio(values.fb_ratio),
      owner_ebitda: values.owner_ebitda || undefined,
      other_income: values.other_income || 0,
      capex_type: values.capex_type,
      construction_cost: values.construction_cost,
      acquisition_price: values.acquisition_price,
      original_cost: values.original_cost,
      renovation_cost: values.renovation_cost,
      equity: values.equity,
    };
    
    onSubmit(processedValues);
  };

  const onFinishFailed: FormProps['onFinishFailed'] = (errorInfo) => {
    const first = errorInfo.errorFields[0];
    if (first) {
      message.warning(`请完善表单：${first.errors[0]}`);
    }
  };

  return (
    <Card title="酒店资产估值输入表单" style={{ width: '100%' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        scrollToFirstError={{ behavior: 'smooth', block: 'center', focus: true }}
      >
        <Divider titlePlacement="start">通用信息</Divider>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="hotel_name"
              label="酒店名称"
              rules={[{ required: true, message: '请输入酒店名称' }]}
            >
              <Input placeholder="例如：上海外滩茂悦大酒店" />
            </Form.Item>
            <Space style={{ marginTop: -12, marginBottom: 16 }}>
              <Button size="small" icon={<SearchOutlined />} onClick={() => openDrawer('map')}>
                联网识别
              </Button>
              <Button size="small" icon={<SnippetsOutlined />} onClick={() => openDrawer('paste')}>
                粘贴解析
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="rooms"
              label="房间数"
              rules={[{ required: true, message: '请输入房间数' }, { type: 'number', min: 1, message: '房间数必须大于0' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入房间数" />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="opening_date"
              label="开业时间"
              rules={[{ required: true, message: '请选择开业时间' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="gfa"
              label="总建筑面积（不含地下室）㎡"
              rules={[{ required: true, message: '请输入总建筑面积' }, { type: 'number', min: 0, message: '面积必须大于等于0' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="平方米" />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="city_tier"
              label="城市等级"
              rules={[{ required: true, message: '请选择城市等级' }]}
            >
              <Select placeholder="选择城市等级">
                <Option value="一线">一线</Option>
                <Option value="新一线">新一线</Option>
                <Option value="二线">二线</Option>
                <Option value="三线">三线</Option>
                <Option value="四线及以下">四线及以下</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="location"
              label="区位"
              rules={[{ required: true, message: '请选择区位' }]}
            >
              <Select placeholder="选择区位">
                <Option value="CBD">CBD</Option>
                <Option value="次中心">次中心</Option>
                <Option value="近郊新区">近郊新区</Option>
                <Option value="景区度假地">景区度假地</Option>
                <Option value="机场高铁">机场高铁</Option>
                <Option value="产业园区">产业园区</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="segment"
              label="档次"
              rules={[{ required: true, message: '请选择档次' }]}
            >
              <Select placeholder="选择档次">
                <Option value="S1">S1 - 豪华</Option>
                <Option value="S2">S2 - 超高端</Option>
                <Option value="S3">S3 - 高端</Option>
                <Option value="S4">S4 - 中高端</Option>
                <Option value="S5">S5 - 中档</Option>
                <Option value="S6">S6 - 经济型</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="property_type"
              label="业态"
              rules={[{ required: true, message: '请选择业态' }]}
            >
              <Select placeholder="选择业态">
                <Option value="P1">P1 - 综合型</Option>
                <Option value="P2">P2 - 商务型</Option>
                <Option value="P3">P3 - 度假型</Option>
                <Option value="P4">P4 - 会议型</Option>
                <Option value="P5">P5 - 长住型</Option>
                <Option value="P6">P6 - 主题型</Option>
                <Option value="P7">P7 - 精品型</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="operation_mode"
              label="经营模式"
              rules={[{ required: true, message: '请选择经营模式' }]}
            >
              <Select placeholder="选择经营模式">
                <Option value="M1">M1 - 自营</Option>
                <Option value="M2">M2 - 委托管理</Option>
                <Option value="M3">M3 - 特许经营</Option>
                <Option value="M4">M4 - 租赁经营</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="other_income"
              label="其他收入（万元）"
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="默认为0" />
            </Form.Item>
          </Col>
        </Row>
        
        <Divider titlePlacement="start">财务信息</Divider>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="ctrip_adr"
              label="携程均价（元）"
              rules={[{ required: true, message: '请输入携程均价' }, { type: 'number', min: 0, message: '均价必须大于等于0' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="含税均价" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="occupancy_input"
              label="全年出租率（%）"
              rules={[
                { required: true, message: '请输入全年出租率' },
                { type: 'number', min: 0, max: 100, message: '出租率应在0-100之间' }
              ]}
            >
              <InputNumber 
                min={0} 
                max={100} 
                step={0.1}
                suffix="%"
                style={{ width: '100%' }} 
                placeholder="0-100，如70表示70%" 
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="fb_ratio"
              label="餐饮÷客房收入比（%）"
              extra="= 餐饮占总收入比 ÷ 客房占总收入比"
              rules={[{ required: true, message: '请输入餐饮÷客房收入比' }, { type: 'number', min: 0, message: '比例必须大于等于0' }]}
            >
              <InputNumber 
                min={0} 
                step={0.1}
                suffix="%"
                style={{ width: '100%' }} 
                placeholder="例如：餐饮40%÷客房55% = 72.7" 
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="owner_ebitda"
              label="EBITDA（万元）"
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="作为校准锚点" />
            </Form.Item>
          </Col>
        </Row>
        
        <Divider titlePlacement="start">投资与资本</Divider>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="capex_type"
              label="投资口径"
              rules={[{ required: true, message: '请选择投资口径' }]}
            >
              <Select placeholder="选择投资口径">
                <Option value="new">新建</Option>
                <Option value="acquisition">存量购买</Option>
                <Option value="self_renew">自有更新</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="equity"
              label="自有资金（万元）"
              rules={[{ required: true, message: '请输入自有资金' }, { type: 'number', min: 0, message: '资金必须大于等于0' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="IRR 杠杆基数" />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item noStyle dependencies={['capex_type']}>
          {({ getFieldValue }) => {
            const capexType = getFieldValue('capex_type');
            
            if (capexType === 'new') {
              return (
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="construction_cost"
                      label="建造成本（不含土地，开业前）万元"
                      rules={[{ required: true, message: '请输入建造成本' }, { type: 'number', min: 0, message: '成本必须大于等于0' }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} placeholder="总金额" />
                    </Form.Item>
                  </Col>
                </Row>
              );
            } else if (capexType === 'acquisition') {
              return (
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="acquisition_price"
                      label="存量购买价（万元）"
                      rules={[{ required: true, message: '请输入购买价格' }, { type: 'number', min: 0, message: '价格必须大于等于0' }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} placeholder="购买价格" />
                    </Form.Item>
                  </Col>
                </Row>
              );
            } else if (capexType === 'self_renew') {
              return (
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="original_cost"
                      label="原建造成本（万元）"
                      rules={[{ required: true, message: '请输入原建造成本' }, { type: 'number', min: 0, message: '成本必须大于等于0' }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} placeholder="原建造成本" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="renovation_cost"
                      label="改造费用（万元）"
                      rules={[{ required: true, message: '请输入改造费用' }, { type: 'number', min: 0, message: '费用必须大于等于0' }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} placeholder="改造费用" />
                    </Form.Item>
                  </Col>
                </Row>
              );
            }
            return null;
          }}
        </Form.Item>

        <Divider titlePlacement="start">市场参考（可选）</Divider>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name="land_price_per_sqm"
              label="土地楼板价（元/㎡）"
              extra="搜索地区纯商业楼面价"
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="例如：5000" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="construction_cost_per_sqm"
              label="建造成本（元/㎡）"
              extra="搜索地区建造成本"
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="例如：4000" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="actual_transaction_price"
              label="实际成交价（万元）"
              extra="搜索同地区酒店成交价"
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="例如：15000" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ marginTop: 16 }}>
            计算估值
          </Button>
        </Form.Item>
      </Form>

      <AutoFillDrawer
        open={drawerOpen}
        defaultKeyword={drawerKeyword}
        initialTab={drawerTab}
        onClose={() => setDrawerOpen(false)}
        onApply={handleAutoFillApply}
        onPickHotelName={(name) => form.setFieldsValue({ hotel_name: name })}
      />
    </Card>
  );
};

export default InputForm;