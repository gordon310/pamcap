import { useState } from 'react';
import type { FC } from 'react';
import { Card, Table, InputNumber, Button, Space, Modal, Input, Badge, Alert, Typography } from 'antd';
import { EditOutlined, CalculatorOutlined, DownloadOutlined } from '@ant-design/icons';
import { coefficientLabel } from '../constants/coefficientLabels';

const { Text } = Typography;

interface CoefficientRow {
  path: string;
  label: string;
  value: number;
}

interface CoefficientAdjusterProps {
  baseline: Record<string, any>;
  overrides: Record<string, any>;
  usedPaths?: string[];
  canRevalue: boolean;
  adjustmentCount: number;
  onAdjustment: (keyPath: string, newValue: number, reason: string) => void;
  onRevalue: () => void;
  onExportAdjustments: () => void;
}

function getByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

const CoefficientAdjuster: FC<CoefficientAdjusterProps> = ({
  baseline,
  overrides,
  usedPaths,
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

  const rows: CoefficientRow[] = [];
  const seen = new Set<string>();
  for (const path of usedPaths || []) {
    if (seen.has(path)) continue;
    seen.add(path);
    const override = getByPath(overrides, path);
    const value = typeof override === 'number' ? override : getByPath(baseline, path);
    if (typeof value !== 'number' || !isFinite(value)) continue;
    rows.push({ path, label: coefficientLabel(path), value });
  }

  const handleEditClick = (record: CoefficientRow) => {
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
      title: '系数说明',
      key: 'label',
      width: '50%',
      render: (_: unknown, record: CoefficientRow) => (
        <div>
          <div>{record.label}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{record.path}</Text>
        </div>
      ),
    },
    {
      title: '当前值',
      dataIndex: 'value',
      key: 'value',
      width: '22%',
      render: (value: number) => value.toFixed(4),
    },
    {
      title: '操作',
      key: 'action',
      width: '28%',
      render: (_: unknown, record: CoefficientRow) => (
        <Button type="primary" icon={<EditOutlined />} onClick={() => handleEditClick(record)}>
          调整
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="本次估值系数"
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
        {rows.length === 0 ? (
          <Alert
            type="info"
            showIcon
            message="请先在「输入」页完成一次估值计算，这里只显示本次实际参与计算的系数。"
          />
        ) : (
          <Table
            columns={columns}
            dataSource={rows}
            rowKey="path"
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>

      <Modal
        title={`调整系数: ${editingKey ? coefficientLabel(editingKey) : ''}`}
        open={showModal}
        onOk={handleSave}
        onCancel={handleCancel}
        okText="保存"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <div>当前值: {editingKey ? rows.find((c) => c.path === editingKey)?.value.toFixed(4) : ''}</div>
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
