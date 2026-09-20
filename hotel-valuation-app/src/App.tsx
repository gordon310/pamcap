import { useState } from 'react';
import { Layout, Menu, theme, Space, Button, Tabs } from 'antd';
import InputForm from './components/InputForm';
import ResultsView from './components/ResultsView';
import CoefficientAdjuster from './components/CoefficientAdjuster';
import OpinionManager from './components/OpinionManager';
import VersionHistory from './components/VersionHistory';
import type { ValuationInput } from './types';
import { useStore } from './stores';
import { ExportOutlined, CalculatorOutlined, SolutionOutlined, SettingOutlined, MessageOutlined, HistoryOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;

function App() {
  const [activeMainTab, setActiveMainTab] = useState<'input' | 'results' | 'coefficients' | 'opinions' | 'versions'>('input');
  const {
    result,
    baseline,
    overrides,
    opinions,
    versions,
    currentVersionId,
    calculate,
    addOpinion,
    updateOpinion,
    deleteOpinion,
    adjustCoefficient,
    createVersion,
    exportSkillPackage
  } = useStore();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleFormSubmit = (values: ValuationInput) => {
    // Calculate the valuation
    calculate(values);
    
    // Switch to results page
    setActiveMainTab('results');
  };

  const handleExportSkillPackage = () => {
    const skillPackage = exportSkillPackage();
    if (!skillPackage) {
      alert('请先进行估值计算');
      return;
    }

    // Convert to JSON and trigger download
    const jsonString = JSON.stringify(skillPackage, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hotel-valuation-skill.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Determine menu items based on availability
  const menuItems = [
    { key: 'input', label: '输入', icon: <SolutionOutlined /> },
    { key: 'results', label: '结果', icon: <CalculatorOutlined />, disabled: !result },
    { key: 'coefficients', label: '系数调整', icon: <SettingOutlined />, disabled: !baseline },
    { key: 'opinions', label: '专家意见', icon: <MessageOutlined />, disabled: !result },
    { key: 'versions', label: '版本管理', icon: <HistoryOutlined />, disabled: !result },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div className="demo-logo" style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
          酒店资产估值验证应用（专家版）
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[activeMainTab]}
          items={menuItems}
          onClick={({ key }) => setActiveMainTab(key as any)}
          style={{ flex: 1, minWidth: 0, marginLeft: '24px' }}
        />
        <Space>
          {result && (
            <Button 
              type="primary" 
              icon={<ExportOutlined />} 
              onClick={handleExportSkillPackage}
            >
              导出 Skill 包
            </Button>
          )}
        </Space>
      </Header>
      <Content style={{ padding: '24px' }}>
        <div
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            padding: '24px',
            minHeight: 600,
          }}
        >
          <Tabs 
            activeKey={activeMainTab} 
            onChange={(key) => setActiveMainTab(key as any)}
            items={[
              {
                key: 'input',
                label: '输入',
                children: <InputForm onSubmit={handleFormSubmit} />
              },
              {
                key: 'results',
                label: '结果',
                disabled: !result,
                children: <ResultsView result={result} />
              },
              {
                key: 'coefficients',
                label: '系数调整',
                disabled: !baseline,
                children: (
                  <CoefficientAdjuster 
                    baseline={{...baseline, ...overrides}} 
                    onAdjustment={adjustCoefficient} 
                  />
                )
              },
              {
                key: 'opinions',
                label: '专家意见',
                disabled: !result,
                children: (
                  <OpinionManager 
                    opinions={opinions} 
                    onAddOpinion={addOpinion}
                    onUpdateOpinion={updateOpinion}
                    onDeleteOpinion={deleteOpinion}
                  />
                )
              },
              {
                key: 'versions',
                label: '版本管理',
                disabled: !result,
                children: (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <Button 
                        type="primary" 
                        onClick={() => createVersion('final')}
                        disabled={!result}
                      >
                        创建定稿版本
                      </Button>
                      <span style={{ marginLeft: 16 }}>当前版本: {currentVersionId || '未创建版本'}</span>
                    </div>
                    <VersionHistory 
                      versions={versions} 
                      currentVersionId={currentVersionId}
                      onRevertToVersion={() => {}}
                      onViewVersion={() => {}}
                    />
                  </div>
                )
              }
            ]}
          />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        酒店资产估值验证应用 ©{new Date().getFullYear()} Created by 螃蟹树聚
      </Footer>
    </Layout>
  );
}

export default App;