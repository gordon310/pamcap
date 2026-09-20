import type { FC } from 'react';
import { Card, Input, Alert, Tag, Space, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { Evaluation, Expert } from '../types';

const { Text } = Typography;
const { TextArea } = Input;

interface EvaluationPanelProps {
  expert: Expert | null;
  evaluation: Evaluation | null;
  onChange: (content: string) => void;
}

const EvaluationPanel: FC<EvaluationPanelProps> = ({ expert, evaluation, onChange }) => {
  const content = evaluation?.content || '';
  const filled = content.trim().length > 0;

  return (
    <Card
      title={
        <Space>
          <EditOutlined />
          <span>专家评估意见（必填）</span>
          {filled ? <Tag color="green">已填写</Tag> : <Tag color="red">未填写</Tag>}
        </Space>
      }
      style={{ marginBottom: 24 }}
    >
      <Text type="secondary">
        请基于本次估值结果给出评估意见（计算过程、系数合理性、结论可信度等）。未填写将无法导出 Skill 包。
      </Text>
      <TextArea
        style={{ marginTop: 12 }}
        rows={4}
        value={content}
        maxLength={2000}
        showCount
        placeholder="例如：本次采用的 GOP 率偏高，建议下调；地段系数取值合理；收益法与倍数法差异较大，建议以收益法为主……"
        onChange={(e) => onChange(e.target.value)}
      />
      <div style={{ marginTop: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          评估人：{expert ? `${expert.name}（${expert.email}）` : '未登记'}
          {evaluation?.at ? ` · ${new Date(evaluation.at).toLocaleString('zh-CN')}` : ''}
        </Text>
      </div>
      {!filled && (
        <Alert
          style={{ marginTop: 12 }}
          type="warning"
          showIcon
          message="请填写专家评估意见后再导出 Skill 包。"
        />
      )}
    </Card>
  );
};

export default EvaluationPanel;
