import type { FC } from 'react';
import { Modal, Form, Input, Typography } from 'antd';
import { UserOutlined, MailOutlined } from '@ant-design/icons';
import type { Expert } from '../types';
import { isValidEmail } from '../services/profile';

const { Text } = Typography;

interface ExpertGateProps {
  open: boolean;
  experts: Expert[];
  onSubmit: (expert: Expert) => void;
}

const ExpertGate: FC<ExpertGateProps> = ({ open, experts, onSubmit }) => {
  const [form] = Form.useForm();

  const submit = (expert: Expert) => {
    onSubmit(expert);
    form.resetFields();
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      submit({ name: values.name.trim(), email: values.email.trim() });
    });
  };

  return (
    <Modal
      title={experts.length > 0 ? '专家登录 / 加入' : '专家登记'}
      open={open}
      onOk={handleOk}
      okText="进入应用"
      cancelButtonProps={{ style: { display: 'none' } }}
      closable={false}
      maskClosable={false}
      keyboard={false}
    >
      <Text type="secondary">请填写姓名与邮箱；未登记将自动加入。</Text>

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
