import type { FC } from 'react';
import { Card, Table, Button, Tag, Space } from 'antd';
import { HistoryOutlined, EyeOutlined, RollbackOutlined } from '@ant-design/icons';
import type { Version } from '../types';

interface VersionHistoryProps {
  versions: Version[];
  currentVersionId: string | null;
  onRevertToVersion: (versionId: string) => void;
  onViewVersion: (version: Version) => void;
}

const VersionHistory: FC<VersionHistoryProps> = ({ 
  versions, 
  currentVersionId,
  onRevertToVersion,
  onViewVersion
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'final': return 'green';
      case 'draft': return 'orange';
      case 'review': return 'blue';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: '版本ID',
      dataIndex: 'id',
      key: 'id',
      width: '25%',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'at',
      key: 'at',
      width: '25%',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: '35%',
      render: (_: any, record: Version) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => onViewVersion(record)}
          >
            查看
          </Button>
          <Button 
            type="link"
            icon={<RollbackOutlined />}
            disabled={record.id === currentVersionId}
            onClick={() => onRevertToVersion(record.id)}
          >
            回滚至此版本
          </Button>
          {record.status !== 'final' && (
            <Button 
              type="primary"
              danger
              size="small"
            >
              设为定稿
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card 
      title="版本历史"
      extra={
        <Button 
          type="primary" 
          icon={<HistoryOutlined />}
        >
          查看历史
        </Button>
      }
    >
      <Table 
        columns={columns} 
        dataSource={versions} 
        rowKey="id"
        pagination={{ pageSize: 10 }}
        size="small"
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};

export default VersionHistory;