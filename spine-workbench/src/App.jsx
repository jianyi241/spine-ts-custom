import { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Stack,
} from "react-bootstrap";

import SpinePreview from "./components/SpinePreview.jsx";

const DEFAULT_URL =
  "https://act.mihoyo.com/ys/event/e20250620skk-fboy94/index.html";

function fileLabel(fileName) {
  const ext = fileName.split(".").pop();
  if (ext === "json") return "JSON";
  if (ext === "atlas") return "ATLAS";
  return "贴图";
}

export default function App() {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [result, setResult] = useState(null);
  const [selectedAssetName, setSelectedAssetName] = useState("");
  const [selectedAnimation, setSelectedAnimation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedAsset = useMemo(() => {
    return result?.assets.find((asset) => asset.name === selectedAssetName) || null;
  }, [result, selectedAssetName]);

  async function handleExtract(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "提取失败");
      }

      setResult(payload);
      const firstAsset = payload.assets[0] || null;
      setSelectedAssetName(firstAsset?.name || "");
      setSelectedAnimation(
        firstAsset?.defaultAnimation || firstAsset?.animationNames?.[0] || ""
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "提取失败"
      );
      setResult(null);
      setSelectedAssetName("");
      setSelectedAnimation("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <Container fluid="xl" className="py-4 py-lg-5">
        <section className="hero-panel mb-4 mb-lg-5">
          <div className="hero-panel__glow" />
          <Row className="g-4 align-items-center">
            <Col lg={7}>
              <div className="eyebrow">Spine Asset Workbench</div>
              <h1 className="display-title">
                从活动页里抽离 Spine 资源
                <span>并直接预览动态效果</span>
              </h1>
              <p className="hero-copy">
                这个工作台现在放在独立的 `spine-workbench/` 目录中。输入网址后会提取所有 Spine 资源，下面列表可逐个预览、单独下载，也能整批打包。
              </p>
            </Col>
            <Col lg={5}>
              <Card className="control-card shadow-lg">
                <Card.Body className="p-4">
                  <Form onSubmit={handleExtract}>
                    <Stack gap={3}>
                      <div>
                        <Form.Label className="section-label">
                          页面网址
                        </Form.Label>
                        <Form.Control
                          type="url"
                          placeholder="https://act.mihoyo.com/..."
                          value={url}
                          onChange={(event) => setUrl(event.target.value)}
                          className="url-input"
                          required
                        />
                      </div>

                      <Stack direction="horizontal" gap={2}>
                        <Button
                          type="submit"
                          className="extract-button"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              正在提取
                            </>
                          ) : (
                            "提取并预览"
                          )}
                        </Button>
                        <Button
                          variant="outline-light"
                          onClick={() => setUrl(DEFAULT_URL)}
                          disabled={loading}
                        >
                          填充示例
                        </Button>
                      </Stack>
                    </Stack>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </section>

        {error ? (
          <Alert variant="danger" className="border-0 shadow-sm">
            {error}
          </Alert>
        ) : null}

        {result ? (
          <>
            <section className="summary-grid mb-4">
              <Card className="summary-card">
                <Card.Body>
                  <div className="summary-label">识别总数</div>
                  <div className="summary-value">{result.assetCount}</div>
                </Card.Body>
              </Card>
              <Card className="summary-card">
                <Card.Body>
                  <div className="summary-label">成功提取</div>
                  <div className="summary-value">{result.savedCount}</div>
                </Card.Body>
              </Card>
              <Card className="summary-card">
                <Card.Body>
                  <div className="summary-label">当前会话</div>
                  <div className="summary-value summary-value--small">
                    {result.sessionId}
                  </div>
                </Card.Body>
              </Card>
              <Card className="summary-card summary-card--action">
                <Card.Body>
                  <div className="summary-label">批量操作</div>
                  <Button
                    href={result.downloadUrl}
                    variant="light"
                    className="w-100"
                  >
                    下载全部 ZIP
                  </Button>
                </Card.Body>
              </Card>
            </section>

            {result.warnings?.length ? (
              <Alert variant="warning" className="border-0 shadow-sm">
                <div className="fw-semibold mb-2">存在部分警告</div>
                <ul className="mb-0 ps-3">
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </Alert>
            ) : null}

            <Row className="g-4 align-items-stretch">
              <Col xl={4}>
                <Card className="panel-card h-100">
                  <Card.Body className="p-3 p-lg-4">
                    <div className="panel-title-row mb-3">
                      <div>
                        <div className="section-label">提取结果</div>
                        <h2 className="panel-title">资源列表</h2>
                      </div>
                    </div>

                    <Stack gap={3} className="asset-list">
                      {result.assets.map((asset) => (
                        <button
                          type="button"
                          key={asset.name}
                          className={`asset-item ${
                            asset.name === selectedAssetName ? "asset-item--active" : ""
                          }`}
                          onClick={() => {
                            setSelectedAssetName(asset.name);
                            setSelectedAnimation(
                              asset.defaultAnimation || asset.animationNames[0] || ""
                            );
                          }}
                        >
                          <div className="asset-item__header">
                            <div>
                              <div className="asset-item__name">{asset.name}</div>
                              <div className="asset-item__meta">
                                {asset.textureCount} 张贴图 /{" "}
                                {asset.animationNames.length} 个动画
                              </div>
                            </div>
                            <Badge bg="dark" pill>
                              {asset.defaultAnimation || "静态"}
                            </Badge>
                          </div>

                          <div className="asset-item__chips">
                            <span>{asset.atlasFile}</span>
                            <span>{asset.jsonFile}</span>
                          </div>

                          <Button
                            href={asset.downloadUrl}
                            size="sm"
                            variant="outline-light"
                            onClick={(event) => event.stopPropagation()}
                          >
                            下载该资源
                          </Button>
                        </button>
                      ))}
                    </Stack>
                  </Card.Body>
                </Card>
              </Col>

              <Col xl={8}>
                <Card className="panel-card h-100">
                  <Card.Body className="p-3 p-lg-4">
                    <div className="panel-title-row mb-3">
                      <div>
                        <div className="section-label">动态预览</div>
                        <h2 className="panel-title">
                          {selectedAsset ? selectedAsset.name : "请选择一个资源"}
                        </h2>
                      </div>

                      {selectedAsset ? (
                        <div className="animation-select-wrap">
                          <Form.Label className="section-label mb-1">
                            当前动画
                          </Form.Label>
                          <Form.Select
                            value={selectedAnimation}
                            onChange={(event) => setSelectedAnimation(event.target.value)}
                          >
                            {selectedAsset.animationNames.map((animationName) => (
                              <option key={animationName} value={animationName}>
                                {animationName}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                      ) : null}
                    </div>

                    <SpinePreview
                      asset={selectedAsset}
                      animation={selectedAnimation}
                    />

                    {selectedAsset ? (
                      <div className="detail-grid mt-4">
                        <Card className="detail-card">
                          <Card.Body>
                            <div className="section-label">动画清单</div>
                            <Stack direction="horizontal" gap={2} className="flex-wrap">
                              {selectedAsset.animationNames.map((animationName) => (
                                <Badge bg="secondary" key={animationName}>
                                  {animationName}
                                </Badge>
                              ))}
                            </Stack>
                          </Card.Body>
                        </Card>

                        <Card className="detail-card">
                          <Card.Body>
                            <div className="section-label">文件下载</div>
                            <Stack direction="horizontal" gap={2} className="flex-wrap">
                              {[selectedAsset.atlasFile, selectedAsset.jsonFile, ...selectedAsset.imageFiles].map(
                                (fileName) => (
                                  <a
                                    key={fileName}
                                    href={`${selectedAsset.baseUrl}${fileName}`}
                                    className="file-pill"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <span>{fileLabel(fileName)}</span>
                                    <strong>{fileName}</strong>
                                  </a>
                                )
                              )}
                            </Stack>
                          </Card.Body>
                        </Card>
                      </div>
                    ) : null}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        ) : null}
      </Container>
    </div>
  );
}
