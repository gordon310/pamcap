import { useState } from 'react';
import type { FC } from 'react';
import { Card, Table, InputNumber, Button, Space, Modal, Input, Badge } from 'antd';
import { EditOutlined, CalculatorOutlined, DownloadOutlined } from '@ant-design/icons';

interface CoefficientAdjusterProps {
  baseline: Record<string, any>;
  canRevalue: boolean;
  adjustmentCount: number;
  onAdjustment: (keyPath: string, newValue: number, reason: string) => void;
  onRevalue: () => void;
  onExportAdjustments: () => void;
}

const CoefficientAdjuster: FC<CoefficientAdjusterProps> = ({
  baseline,
  canRevalue,
  adjustmentCount,
  onAdjustment,
  onRevalue,
  onExportAdjustments,
}) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newValue, setNewValue] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);

  // Flatten the baseline object to extract all numeric coefficients
  const flattenObject = (obj: any, prefix: string = ''): Array<{ key: string; value: number; path: string }> => {
    const flattened: Array<{ key: string; value: number; path: string }> = [];

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newPath = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'number') {
        flattened.push({ key, value, path: newPath });
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattened.push(...flattenObject(value, newPath));
      }
    });

    return flattened;
  };

  const allCoefficients = flattenObject(baseline);

  const handleEditClick = (record: { path: string; value: number }) => {
    setEditingKey(record.path);
    setNewValue(record.value);
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingKey && reason.trim()) {
      onAdjustment(editingKey, newValue, reason);
      setEditingKey(null);
      setNewValue(0);
      setReason('');
      setShowModal(false);
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setNewValue(0);
    setReason('');
    setShowModal(false);
  };

  const columns = [
    {
      title: '系数路径',
      dataIndex: 'path',
      key: 'path',
      width: '40%',
    },
    {
      title: '当前值',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => value.toFixed(4),
      width: '20%',
    },
    {
      title: '操作',
      key: 'action',
      width: '20%',
      render: (_: any, record: { path: string; value: number }) => (
        <Button 
          type="primary" 
          icon={<EditOutlined />} 
          onClick={() => handleEditClick(record)}
        >
          调整
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="基准系数管理"
        extra={
          <Space wrap>
            <Badge count={adjustmentCount} size="small" offset={[-2, 2]}>
              <Button
                icon={<DownloadOutlined />}
                onClick={onExportAdjustments}
                disabled={adjustmentCount === 0}
              >
                导出系数调整汇总
              </Button>
            </Badge>
            <Button
              type="primary"
              icon={<CalculatorOutlined />}
              onClick={onRevalue}
              disabled={!canRevalue}
            >
              重新估值
            </Button>
          </Space>
        }
      >
        <Table 
          columns={columns} 
          dataSource={allCoefficients} 
          rowKey="path"
          pagination={{ pageSize: 10 }}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={`调整系数: ${editingKey}`}
        open={showModal}
        onOk={handleSave}
        onCancel={handleCancel}
        okText="保存"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <div>当前值: {editingKey ? allCoefficients.find(c => c.path === editingKey)?.value.toFixed(4) : ''}</div>
            <div>新值:</div>
            <InputNumber 
              value={newValue} 
              onChange={(val) => setNewValue(val || 0)} 
              style={{ width: '100%' }}
              precision={6}
            />
          </div>
          <div>
            <div>调整原因:</div>
            <Input.TextArea 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              rows={3}
              placeholder="请输入调整原因..."
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default CoefficientAdjuster;