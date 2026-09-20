import { useState } from 'react';
import type { FC } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Tag, Space } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import type { Opinion } from '../types';

const { TextArea } = Input;
const { Option } = Select;

interface OpinionManagerProps {
  opinions: Opinion[];
  onAddOpinion: (opinion: Omit<Opinion, 'id' | 'at'>) => void;
  onUpdateOpinion: (id: string, opinion: Opinion) => void;
  onDeleteOpinion: (id: string) => void;
}

const OpinionManager: FC<OpinionManagerProps> = ({ 
  opinions, 
  onAddOpinion, 
  onUpdateOpinion,
  onDeleteOpinion
}) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingOpinion, setEditingOpinion] = useState<Opinion | null>(null);
  const [form] = Form.useForm();

  const showModal = (opinion?: Opinion) => {
    if (opinion) {
      setEditingOpinion(opinion);
      form.setFieldsValue({
        target: opinion.target,
        content: opinion.content,
        status: opinion.status,
      });
    } else {
      setEditingOpinion(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      const opinionData = {
        target: values.target,
        content: values.content,
        author: '专家',
        status: values.status,
      };

      if (editingOpinion) {
        // Update existing opinion
        const updatedOpinion: Opinion = {
          ...editingOpinion,
          ...opinionData,
          at: new Date().toISOString()
        };
        onUpdateOpinion(editingOpinion.id, updatedOpinion);
      } else {
        // Add new opinion
        onAddOpinion(opinionData);
      }

      setModalVisible(false);
      form.resetFields();
    });
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingOpinion(null);
    form.resetFields();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '采纳': return 'green';
      case '驳回': return 'red';
      case '草稿': return 'orange';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: '绑定对象',
      dataIndex: 'target',
      key: 'target',
      width: '20%',
    },
    {
      title: '意见内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '状态',
      key: 'status',
      width: '15%',
      render: (_: any, record: Opinion) => (
        <Tag color={getStatusColor(record.status)}>
          {record.status}
        </Tag>
      ),
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: '10%',
    },
    {
      title: '时间',
      dataIndex: 'at',
      key: 'at',
      width: '15%',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: '15%',
      render: (_: any, record: Opinion) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger
            onClick={() => onDeleteOpinion(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card 
      title="专家意见管理"
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => showModal()}
        >
          添加意见
        </Button>
      }
    >
      <Table 
        columns={columns} 
        dataSource={opinions} 
        rowKey="id"
        pagination={{ pageSize: 10 }}
        size="small"
      />

      <Modal
        title={editingOpinion ? "编辑意见" : "添加意见"}
        open={modalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="target"
            label="绑定对象"
            rules={[{ required: true, message: '请选择绑定对象' }]}
          >
            <Select placeholder="选择要绑定的对象">
              <Option value="input">输入信息</Option>
              <Option value="S0">分类解析</Option>
              <Option value="S1">ADR</Option>
              <Option value="S2">OCC</Option>
              <Option value="S3">RevPAR</Option>
              <Option value="S4">客房收入</Option>
              <Option value="S5">餐饮收入</Option>
              <Option value="S6">GOR</Option>
              <Option value="S7">GOP</Option>
              <Option value="S8">FF&E</Option>
              <Option value="S9">管理费</Option>
              <Option value="S10">物业税</Option>
              <Option value="S11">保险</Option>
              <Option value="S12">NOI</Option>
              <Option value="S13">业主费用</Option>
              <Option value="S14">EBITDA（估算）</Option>
              <Option value="S15">校准</Option>
              <Option value="S16">地段系数</Option>
              <Option value="S17">Cap Rate</Option>
              <Option value="S18">收益法估值</Option>
              <Option value="S19">倍数法估值</Option>
              <Option value="S20">成本法估值</Option>
              <Option value="S21">估值区间</Option>
              <Option value="S22">DSCR</Option>
              <Option value="S23">IRR</Option>
              <Option value="result">整体结论</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="content"
            label="意见内容"
            rules={[{ required: true, message: '请输入意见内容' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="请输入专家意见..."
            />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="选择状态">
              <Option value="草稿">草稿</Option>
              <Option value="采纳">采纳</Option>
              <Option value="驳回">驳回</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default OpinionManager;