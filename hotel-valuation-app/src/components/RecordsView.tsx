import { useMemo, useState } from 'react';
import type { FC } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Upload,
  Drawer,
  Descriptions,
  Typography,
  Alert,
  Popconfirm,
  App as AntApp,
} from 'antd';
import { DownloadOutlined, UploadOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ValuationRecord } from '../types';
import { useStore } from '../stores';
import { parseImport, mergeExperts, isSuperUser } from '../services/records';
import { downloadText, readTextFile } from '../utils/download';

const { Text, Paragraph } = Typography;

const kindLabel = (kind: string) => (kind === 'revalue' ? '重新估值' : '生成');

const RecordsView: FC = () => {
  const records = useStore((s) => s.records);
  const experts = useStore((s) => s.experts);
  const remoteExperts = useStore((s) => s.remoteExperts);
  const currentExpert = useStore((s) => s.expert);
  const adjustmentLog = useStore((s) => s.adjustmentLog);
  const lastPruned = useStore((s) => s.lastPruned);
  const deleteRecord = useStore((s) => s.deleteRecord);
  const importRecords = useStore((s) => s.importRecords);
  const { message } = AntApp.useApp();

  const allExperts = useMemo(() => mergeExperts(remoteExperts, experts), [remoteExperts, experts]);
  const isSuper = currentExpert ? isSuperUser(currentExpert, allExperts) : false;

  const [expertFilter, setExpertFilter] = useState<string | undefined>(undefined);
  const [keyword, setKeyword] = useState('');
  const [viewing, setViewing] = useState<ValuationRecord | null>(null);

  const filtered = useMemo(() => {
    const kw = keyword.trim();
    const currentEmail = (currentExpert?.email || '').trim().toLowerCase();
    return records
      .filter((r) => {
        if (!isSuper && (r.expert?.email || '').trim().toLowerCase() !== currentEmail) return false;
        const key = `${r.expert?.name}|${r.expert?.email}`;
        const matchExpert = !expertFilter || key === expertFilter;
        const matchKeyword = !kw || (r.input?.hotel_name || '').includes(kw);
        return matchExpert && matchKeyword;
      })
      .slice()
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [records, expertFilter, keyword, isSuper, currentExpert]);

  const exportBundle = () => {
    downloadText(
      `pamcap-records-${Date.now()}.json`,
      JSON.stringify(
        { generatedAt: new Date().toISOString(), records, experts, adjustments: adjustmentLog },
        null,
        2,
      ),
    );
  };

  const handleImport = async (file: File) => {
    try {
      const bundle = parseImport(await readTextFile(file));
      if (!bundle.records && !bundle.experts && !bundle.adjustments) {
        message.error('文件格式不正确，未识别到记录数据。');
        return;
      }
      importRecords(bundle);
      message.success('导入成功。');
    } catch {
      message.error('导入失败，请检查文件。');
    }
  };

  const columns = [
    { title: '酒店', dataIndex: ['input', 'hotel_name'], key: 'hotel', ellipsis: true },
    {
      title: '专家',
      key: 'expert',
      width: 120,
      render: (_: unknown, r: ValuationRecord) => r.expert?.name || '-',
    },
    {
      title: '时间',
      dataIndex: 'at',
      key: 'at',
      width: 170,
      render: (at: string) => new Date(at).toLocaleString('zh-CN', { hour12: false }),
    },
    {
      title: '类型',
      dataIndex: 'kind',
      key: 'kind',
      width: 100,
      render: (kind: string) => <Tag color={kind === 'revalue' ? 'blue' : 'green'}>{kindLabel(kind)}</Tag>,
    },
    {
      title: '估值基准值（万元）',
      key: 'base',
      width: 150,
      render: (_: unknown, r: ValuationRecord) => {
        const base = r.result?.valuation?.range?.base;
        return typeof base === 'number' ? base.toFixed(0) : '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, r: ValuationRecord) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Space>
            <Button type="link" icon={<EyeOutlined />} onClick={() => setViewing(r)}>
              查看
            </Button>
            <Popconfirm title="确认删除该记录？" onConfirm={() => deleteRecord(r.id)} okText="删除" cancelText="取消">
              <Button type="link" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        </div>
      ),
    },
  ];

  return (
    <div>
      {lastPruned > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={`记录已达本机容量上限，已自动删除最旧的 ${lastPruned} 条，请导出留存。`}
        />
      )}

      <Card
        title="专家生成记录"
        extra={
          <Space wrap>
            <Button icon={<DownloadOutlined />} onClick={exportBundle} disabled={records.length === 0 && adjustmentLog.length === 0}>
              导出 JSON
            </Button>
            <Upload beforeUpload={(file) => { void handleImport(file as File); return false; }} showUploadList={false} accept=".json">
              <Button icon={<UploadOutlined />}>导入 JSON</Button>
            </Upload>
          </Space>
        }
      >
        <Space wrap style={{ marginBottom: 12 }}>
          <Select
            allowClear
            placeholder="按专家筛选"
            style={{ width: 200 }}
            value={expertFilter}
            onChange={setExpertFilter}
            options={experts.map((e) => ({ value: `${e.name}|${e.email}`, label: `${e.name}（${e.email}）` }))}
          />
          <Input.Search
            allowClear
            placeholder="按酒店名搜索"
            style={{ width: 220 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </Space>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: '暂无记录，先去做一次估值计算。' }}
          onRow={(record) => ({
            onClick: () => setViewing(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <Drawer title="记录详情" width={560} open={!!viewing} onClose={() => setViewing(null)}>
        {viewing && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="酒店">{viewing.input?.hotel_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="专家">
                {viewing.expert?.name}（{viewing.expert?.email}）
              </Descriptions.Item>
              <Descriptions.Item label="时间">{new Date(viewing.at).toLocaleString('zh-CN', { hour12: false })}</Descriptions.Item>
              <Descriptions.Item label="类型">{kindLabel(viewing.kind)}</Descriptions.Item>
              <Descriptions.Item label="估值区间（万元）">
                {viewing.result?.valuation
                  ? `${viewing.result.valuation.range.conservative.toFixed(0)} ~ ${viewing.result.valuation.range.optimistic.toFixed(0)}`
                  : '-'}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <Text strong>专家评估</Text>
              <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                {viewing.evaluation?.content || '（无）'}
              </Paragraph>
            </div>

            <div>
              <Text strong>输入数据</Text>
              <Paragraph>
                <pre style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(viewing.input, null, 2)}
                </pre>
              </Paragraph>
            </div>

            <div>
              <Text strong>系数 overrides</Text>
              <Paragraph>
                <pre style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(viewing.overrides, null, 2)}
                </pre>
              </Paragraph>
            </div>

            {(() => {
              const related = adjustmentLog.filter(
                (a) =>
                  a.recordId === viewing.id ||
                  (a.hotel_name === viewing.input?.hotel_name &&
                    (a.expert?.email || '').toLowerCase() === (viewing.expert?.email || '').toLowerCase()),
              );
              return (
                <div>
                  <Text strong>系数调整过程（{related.length}）</Text>
                  {related.length === 0 ? (
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>（无）</Paragraph>
                  ) : (
                    <Table
                      rowKey="id"
                      size="small"
                      pagination={false}
                      dataSource={related}
                      columns={[
                        {
                          title: '时间',
                          dataIndex: 'at',
                          width: 150,
                          render: (v: string) => new Date(v).toLocaleString('zh-CN', { hour12: false }),
                        },
                        { title: '系数', dataIndex: 'key' },
                        { title: '原值', dataIndex: 'old' },
                        { title: '新值', dataIndex: 'new' },
                        { title: '原因', dataIndex: 'reason' },
                      ]}
                    />
                  )}
                </div>
              );
            })()}
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default RecordsView;
