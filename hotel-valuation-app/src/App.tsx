import { useEffect, useMemo, useState } from 'react';
import { Layout, theme, Button, Tabs, Grid, Space, Popover } from 'antd';
import InputForm from './components/InputForm';
import ResultsView from './components/ResultsView';
import CoefficientAdjuster from './components/CoefficientAdjuster';
import OpinionManager from './components/OpinionManager';
import VersionHistory from './components/VersionHistory';
import ExpertGate from './components/ExpertGate';
import RecordsView from './components/RecordsView';
import ExpertsView from './components/ExpertsView';
import { downloadText } from './utils/download';
import { mergeExperts, isSuperUser, parseExpertsJson } from './services/records';
import type { ValuationInput } from './types';
import { useStore } from './stores';
import { hasEvaluation } from './services/profile';
import { ExportOutlined, UserSwitchOutlined, LogoutOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;

function App() {
  const [activeMainTab, setActiveMainTab] = useState<'input' | 'results' | 'coefficients' | 'opinions' | 'versions'>('input');
  const [expertOpen, setExpertOpen] = useState(false);
  const {
    result,
    baseline,
    overrides,
    opinions,
    versions,
    currentVersionId,
    calculate,
    revalue,
    addOpinion,
    updateOpinion,
    deleteOpinion,
    adjustCoefficient,
    createVersion,
    exportSkillPackage,
    exportAdjustmentSubmission,
    expert,
    experts,
    remoteExperts,
    adjustmentLog,
    evaluation,
    loginExpert,
    loadRemoteExperts,
    logoutExpert,
    loadRecord,
  } = useStore();

  const allExperts = useMemo(() => mergeExperts(remoteExperts, experts), [remoteExperts, experts]);
  const isAdmin = expert ? isSuperUser(expert, allExperts) : false;

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}experts.json`)
      .then((r) => (r.ok ? r.text() : ''))
      .then((text) => {
        if (text) loadRemoteExperts(parseExpertsJson(text));
      })
      .catch(() => {
        // 名单文件缺失时忽略，使用本机名单
      });
  }, [loadRemoteExperts]);

  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleFormSubmit = (values: ValuationInput) => {
    calculate(values);
    setActiveMainTab('results');
  };

  const handleExportSkillPackage = () => {
    if (!result) {
      alert('请先进行估值计算');
      return;
    }
    if (!hasEvaluation(evaluation)) {
      alert('请先在“结果”页填写专家评估意见，再导出 Skill 包。');
      setActiveMainTab('results');
      return;
    }
    const skillPackage = exportSkillPackage();
    if (!skillPackage) {
      alert('请先进行估值计算');
      return;
    }
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

  const handleRevalue = () => {
    if (!result) {
      alert('请先进行估值计算');
      return;
    }
    revalue();
  };

  const handleExportAdjustments = () => {
    const { json, csv, count } = exportAdjustmentSubmission();
    if (count === 0) {
      alert('暂无系数调整记录');
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(`pamcap-coefficient-adjustments-${stamp}.json`, json);
    downloadText(`pamcap-coefficient-adjustments-${stamp}.csv`, csv, 'text/csv');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 8 : 14,
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: isMobile ? '0 12px' : '0 24px',
          height: isMobile ? 56 : 64,
          lineHeight: 'normal',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <img
          src={`${import.meta.env.BASE_URL}logo.svg`}
          alt="螃蟹树聚"
          style={{ height: isMobile ? 26 : 34, display: 'block' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: isMobile ? 14 : 17,
              color: '#1f2d3d',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            螃蟹树聚
            <span style={{ color: '#8c8c8c', fontWeight: 400, fontSize: isMobile ? 12 : 14 }}>
              {' '}· 酒店资产估值验证
            </span>
          </div>
        </div>
        <Space size={4}>
          {expert && (
            <Popover
              open={expertOpen}
              onOpenChange={setExpertOpen}
              trigger="click"
              placement="bottomRight"
              content={
                <Space direction="vertical" size={8} style={{ minWidth: 180 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{expert.name}</div>
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>{expert.email}</div>
                  </div>
                  <Space>
                    <Button
                      danger
                      size="small"
                      icon={<LogoutOutlined />}
                      onClick={() => {
                        logoutExpert();
                        setExpertOpen(false);
                      }}
                    >
                      退出登录
                    </Button>
                    <Button size="small" onClick={() => setExpertOpen(false)}>
                      返回
                    </Button>
                  </Space>
                </Space>
              }
            >
              <Button type="text" size="small" icon={<UserSwitchOutlined />}>
                {isMobile ? '' : expert.name}
              </Button>
            </Popover>
          )}
          {result && (
            <Button
              type="primary"
              icon={<ExportOutlined />}
              onClick={handleExportSkillPackage}
              disabled={!hasEvaluation(evaluation)}
              size={isMobile ? 'small' : 'middle'}
            >
              {isMobile ? '导出' : '导出 Skill 包'}
            </Button>
          )}
        </Space>
      </Header>

      <Content style={{ padding: isMobile ? 8 : 24 }}>
        <div
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            padding: isMobile ? 12 : 24,
            minHeight: 480,
          }}
        >
          <Tabs
            activeKey={activeMainTab}
            onChange={(key) => setActiveMainTab(key as any)}
            tabBarStyle={{ marginBottom: isMobile ? 12 : 24 }}
            items={[
              {
                key: 'input',
                label: '输入',
                children: <InputForm onSubmit={handleFormSubmit} />,
              },
              {
                key: 'results',
                label: '结果',
                disabled: !result,
                children: <ResultsView result={result} />,
              },
              {
                key: 'coefficients',
                label: '系数调整',
                disabled: !baseline,
                children: (
                  <CoefficientAdjuster
                    baseline={baseline}
                    overrides={overrides}
                    usedPaths={result?.usedCoefficients}
                    canRevalue={!!result}
                    adjustmentCount={adjustmentLog.length}
                    onAdjustment={adjustCoefficient}
                    onRevalue={handleRevalue}
                    onExportAdjustments={handleExportAdjustments}
                  />
                ),
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
                ),
              },
              {
                key: 'versions',
                label: '版本管理',
                disabled: !result,
                children: (
                  <div>
                    <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <Button
                        type="primary"
                        onClick={() => createVersion('final')}
                        disabled={!result}
                      >
                        创建定稿版本
                      </Button>
                      <span>当前版本: {currentVersionId || '未创建版本'}</span>
                    </div>
                    <VersionHistory
                      versions={versions}
                      currentVersionId={currentVersionId}
                      onRevertToVersion={() => {}}
                      onViewVersion={() => {}}
                    />
                  </div>
                ),
              },
              {
                key: 'records',
                label: '记录',
                children: <RecordsView onLoadRecord={(r) => { loadRecord(r); setActiveMainTab('input'); }} />,
              },
              ...(isAdmin
                ? [{ key: 'experts', label: '专家', children: <ExpertsView /> }]
                : []),
            ]}
          />
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', padding: isMobile ? '12px 8px' : '24px 50px' }}>
        <div style={{ fontWeight: 600, color: '#3B5B9B' }}>螃蟹树聚 · PAMSHARE TREE</div>
        <div style={{ color: '#8c8c8c', fontSize: 12 }}>
          酒店资产估值验证应用（专家版）©{new Date().getFullYear()} · 仅供内部预估/验证
        </div>
        <div style={{ color: '#bfbfbf', fontSize: 11, marginTop: 4 }}>
          版本 {__BUILD_INFO__.sha} · {new Date(__BUILD_INFO__.time).toLocaleString('zh-CN', { hour12: false })}
        </div>
      </Footer>

      <ExpertGate open={!expert} experts={allExperts} onSubmit={loginExpert} />
    </Layout>
  );
}

export default App;
