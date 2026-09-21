import type { FC } from 'react';
import { Modal, Form, Input, Typography, Tag, Space, App as AntApp } from 'antd';
import { UserOutlined, MailOutlined } from '@ant-design/icons';
import type { Expert } from '../types';
import { isValidEmail } from '../services/profile';
import { isExpertRegistered } from '../services/records';

const { Text } = Typography;

interface ExpertGateProps {
  open: boolean;
  experts: Expert[];
  onSubmit: (expert: Expert) => void;
}

const ExpertGate: FC<ExpertGateProps> = ({ open, experts, onSubmit }) => {
  const [form] = Form.useForm();
  const { modal } = AntApp.useApp();

  const submit = (expert: Expert) => {
    onSubmit(expert);
    form.resetFields();
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      const expert: Expert = { name: values.name.trim(), email: values.email.trim() };
      if (isExpertRegistered(expert, experts)) {
        submit(expert);
        return;
      }
      modal.confirm({
        title: '新专家登记',
        content: `「${expert.name}（${expert.email}）」未在本机专家名单中，是否登记并进入？`,
        okText: '登记并进入',
        cancelText: '返回修改',
        onOk: () => submit(expert),
      });
    });
  };

  return (
    <Modal
      title={experts.length > 0 ? '专家登录 / 登记' : '专家登记'}
      open={open}
      onOk={handleOk}
      okText="进入应用"
      cancelButtonProps={{ style: { display: 'none' } }}
      closable={false}
      maskClosable={false}
      keyboard={false}
    >
      <Text type="secondary">请填写姓名与邮箱；已登记专家可直接登录，未登记将提示登记。</Text>

      {experts.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>点击快速填入已登记专家：</Text>
          <div style={{ marginTop: 6 }}>
            <Space size={[4, 4]} wrap>
              {experts.map((e) => (
                <Tag
                  key={`${e.name}|${e.email}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => form.setFieldsValue({ name: e.name, email: e.email })}
                >
                  {e.name}
                </Tag>
              ))}
            </Space>
          </div>
        </div>
      )}

      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="姓名"
          rules={[{ required: true, message: '请输入姓名' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="请输入姓名" maxLength={30} />
        </Form.Item>
        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            {
              validator: (_rule, value) =>
                !value || isValidEmail(value)
                  ? Promise.resolve()
                  : Promise.reject(new Error('邮箱格式不正确')),
            },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="name@example.com" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExpertGate;
