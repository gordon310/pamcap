import { useMemo } from 'react';
import type { FC } from 'react';
import { Card, Table, Button, Tag, Space } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useStore } from '../stores';
import { mergeExperts } from '../services/records';
import { downloadText } from '../utils/download';

interface ExpertRow {
  key: string;
  name: string;
  email: string;
  role: string;
  records: number;
  adjustments: number;
  lastAt: string;
}

const ExpertsView: FC = () => {
  const localExperts = useStore((s) => s.experts);
  const remoteExperts = useStore((s) => s.remoteExperts);
  const records = useStore((s) => s.records);
  const adjustmentLog = useStore((s) => s.adjustmentLog);

  const allExperts = useMemo(() => mergeExperts(remoteExperts, localExperts), [remoteExperts, localExperts]);

  const rows: ExpertRow[] = allExperts.map((e) => {
    const email = (e.email || '').toLowerCase();
    const own = records.filter((r) => (r.expert?.email || '').toLowerCase() === email);
    const adjustments = adjustmentLog.filter((a) => (a.expert?.email || '').toLowerCase() === email);
    return {
      key: email,
      name: e.name,
      email: e.email,
      role: e.role === 'admin' ? '超级用户' : '专家',
      records: own.length,
      adjustments: adjustments.length,
      lastAt: own.map((r) => r.at).sort().pop() || '',
    };
  });

  const exportExperts = () => {
    downloadText(
      'experts.json',
      JSON.stringify(
        {
          experts: allExperts.map((e) => ({ name: e.name, email: e.email, ...(e.role ? { role: e.role } : {}) })),
        },
        null,
        2,
      ),
    );
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 110,
      render: (role: string) => <Tag color={role === '超级用户' ? 'gold' : undefined}>{role}</Tag>,
    },
    { title: '查询记录', dataIndex: 'records', key: 'records', width: 100 },
    { title: '系数调整', dataIndex: 'adjustments', key: 'adjustments', width: 100 },
    {
      title: '最近记录',
      dataIndex: 'lastAt',
      key: 'lastAt',
      width: 170,
      render: (at: string) => (at ? new Date(at).toLocaleString('zh-CN', { hour12: false }) : '-'),
    },
  ];

  return (
    <Card
      title="专家名单"
      extra={
        <Space wrap>
          <Button icon={<DownloadOutlined />} onClick={exportExperts}>
            导出 experts.json
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="key"
        columns={columns}
        dataSource={rows}
        size="small"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: '暂无专家。' }}
      />
    </Card>
  );
};

export default ExpertsView;
