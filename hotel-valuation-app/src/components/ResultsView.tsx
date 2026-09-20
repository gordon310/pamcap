import type { FC } from 'react';
import { Card, Table, Tabs, Statistic, Row, Col, Descriptions, Typography } from 'antd';
import type { ValuationResult } from '../types';

const { Title, Text } = Typography;

interface ResultsViewProps {
  result: ValuationResult | null;
}

const ResultsView: FC<ResultsViewProps> = ({ result }) => {
  if (!result) {
    return (
      <Card>
        <Text type="secondary">请先输入酒店信息并计算估值</Text>
      </Card>
    );
  }

  // Metrics columns for the table
  const metricsColumns = [
    { title: '指标', dataIndex: 'metric', key: 'metric' },
    { title: '值', dataIndex: 'value', key: 'value' },
    { title: '单位', dataIndex: 'unit', key: 'unit' },
  ];

  // Data for metrics table
  const metricsData = [
    { key: '1', metric: 'ADR', value: result.metrics.adr.toFixed(2), unit: '元' },
    { key: '2', metric: 'OCC', value: (result.metrics.occ * 100).toFixed(2), unit: '%' },
    { key: '3', metric: 'RevPAR', value: result.metrics.revpar.toFixed(2), unit: '元' },
    { key: '4', metric: 'GOR', value: result.metrics.gor.toFixed(2), unit: '万元' },
    { key: '5', metric: 'GOP', value: result.metrics.gop.toFixed(2), unit: '万元' },
    { key: '6', metric: 'NOI', value: result.metrics.noi.toFixed(2), unit: '万元' },
    { key: '7', metric: 'EBITDA (估算)', value: result.metrics.ebitda_est.toFixed(2), unit: '万元' },
    { key: '8', metric: 'EBITDA (输入)', value: result.metrics.owner_ebitda?.toFixed(2) || '-', unit: '万元' },
    { key: '9', metric: 'EBITDA (采用值)', value: result.metrics.ebitda_used.toFixed(2), unit: '万元' },
    { key: '10', metric: 'Cap Rate', value: (result.metrics.cap * 100).toFixed(2), unit: '%' },
    { key: '11', metric: '地段系数', value: result.metrics.location_coef.toFixed(4), unit: '' },
    { key: '12', metric: 'DSCR', value: result.metrics.dscr.toFixed(2), unit: '' },
    { key: '13', metric: 'IRR', value: (result.metrics.irr).toFixed(2), unit: '%' },
  ];

  // Valuation columns for the table
  const valuationColumns = [
    { title: '估值方法', dataIndex: 'method', key: 'method' },
    { title: '金额', dataIndex: 'amount', key: 'amount' },
    { title: '单位', dataIndex: 'unit', key: 'unit' },
  ];

  // Data for valuation table
  const valuationData = [
    { key: '1', method: '收益法估值', amount: result.valuation.income.toFixed(2), unit: '万元' },
    { key: '2', method: '倍数法估值', amount: result.valuation.multiple.toFixed(2), unit: '万元' },
    { key: '3', method: '成本法下限', amount: result.valuation.cost_floor.toFixed(2), unit: '万元' },
    { key: '4', method: '每间房价值', amount: result.valuation.per_room.toFixed(2), unit: '万元' },
    { key: '5', method: '每㎡价值', amount: result.valuation.per_sqm.toFixed(4), unit: '万元' },
  ];

  // Valuation Range Statistics
  const rangeData = result.valuation.range;

  // Process trace columns
  const traceColumns = [
    { title: '步骤', dataIndex: 'step', key: 'step', width: 80 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '公式', dataIndex: 'formula', key: 'formula' },
    { title: '代入', dataIndex: 'inputs', key: 'inputs', render: (text: any) => JSON.stringify(text) },
    { title: '结果', dataIndex: 'result', key: 'result', render: (val: number) => val.toFixed(4) },
    { title: '来源', dataIndex: 'source', key: 'source' },
    { title: '备注', dataIndex: 'note', key: 'note' },
  ];

  return (
    <div>
      <Title level={3}>估值结果</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic 
            title="保守估值" 
            value={rangeData.conservative} 
            precision={2}
            valueStyle={{ color: '#cf1322' }}
            prefix="¥"
            suffix="万元"
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="基准估值" 
            value={rangeData.base} 
            precision={2}
            valueStyle={{ color: '#3f8600' }}
            prefix="¥"
            suffix="万元"
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="乐观估值" 
            value={rangeData.optimistic} 
            precision={2}
            valueStyle={{ color: '#1890ff' }}
            prefix="¥"
            suffix="万元"
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="每间房价值" 
            value={result.valuation.per_room} 
            precision={2}
            valueStyle={{ color: '#722ed1' }}
            prefix="¥"
            suffix="万元"
          />
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: '核心指标',
            children: (
              <Table
                columns={metricsColumns}
                dataSource={metricsData}
                pagination={false}
                size="small"
              />
            ),
          },
          {
            key: '2',
            label: '估值详情',
            children: (
              <Table
                columns={valuationColumns}
                dataSource={valuationData}
                pagination={false}
                size="small"
              />
            ),
          },
          {
            key: '3',
            label: '计算过程',
            children: (
              <Table
                columns={traceColumns}
                dataSource={result.trace}
                pagination={{ pageSize: 10 }}
                size="small"
                scroll={{ y: 400 }}
              />
            ),
          },
          {
            key: '4',
            label: '估值区间',
            children: (
              <>
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="保守估值">{rangeData.conservative.toFixed(2)} 万元</Descriptions.Item>
                  <Descriptions.Item label="基准估值">{rangeData.base.toFixed(2)} 万元</Descriptions.Item>
                  <Descriptions.Item label="乐观估值">{rangeData.optimistic.toFixed(2)} 万元</Descriptions.Item>
                </Descriptions>
                <div style={{ marginTop: 16, padding: '16px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
                  <Text strong>提示：</Text>
                  <Text>估值区间反映了不同情景下的估值变化，保守/基准/乐观分别代表了不同程度的市场假设。</Text>
                </div>
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ResultsView;