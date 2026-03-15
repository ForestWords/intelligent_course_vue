<template>
    <div class="workflow-request">
        <h2>工作流请求</h2>

        <!-- API配置区域 -->
        <div class="config-section">
            <h3>API配置</h3>
            <div class="form-group">
                <label for="apiKey">API密钥:</label>
                <input
                    id="apiKey"
                    v-model="apiKey"
                    type="password"
                    placeholder="输入您的API密钥"
                    class="form-input"
                />
            </div>

            <div class="form-group">
                <label for="endpoint">端点URL:</label>
                <input
                    id="endpoint"
                    v-model="endpoint"
                    type="text"
                    placeholder="http://localhost/v1/workflows/run"
                    class="form-input"
                />
            </div>
        </div>

        <!-- 请求参数区域 -->
        <div class="config-section">
            <h3>请求参数</h3>
            <div class="form-group">
                <label for="user">用户标识:</label>
                <input
                    id="user"
                    v-model="user"
                    type="text"
                    placeholder="abc-123"
                    class="form-input"
                />
            </div>

            <div class="form-group">
                <label for="inputs">输入参数:</label>
                <textarea
                    id="inputs"
                    v-model="inputsJson"
                    placeholder='{"key": "value"}'
                    class="form-textarea"
                />
                <div v-if="jsonError" class="error-message">
                    {{ jsonError }}
                </div>
            </div>
        </div>

        <!-- 控制按钮 -->
        <div class="actions">
            <button
                @click="sendRequest"
                :disabled="isLoading || !apiKey"
                class="btn btn-primary"
            >
                {{ isLoading ? "请求中..." : "发送请求" }}
            </button>
            <button
                @click="clearResponse"
                :disabled="isLoading"
                class="btn btn-secondary"
            >
                清除响应
            </button>
        </div>

        <!-- 状态显示 -->
        <div v-if="statusMessage" class="status" :class="statusClass">
            {{ statusMessage }}
        </div>

        <!-- 响应显示区域 -->
        <div class="response-section">
            <h3>响应内容</h3>
            <div class="response-container">
                <pre v-if="responseData" class="response-data">{{
                    responseData
                }}</pre>
                <div v-else class="empty-state">暂无响应数据</div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, onUnmounted } from "vue";

export default {
    name: "WorkflowRequest",
    setup() {
        // 响应式数据
        const apiKey = ref("");
        const endpoint = ref("http://localhost/v1/workflows/run");
        const user = ref("abc-123");
        const inputsJson = ref("{}");
        const responseData = ref("");
        const isLoading = ref(false);
        const statusMessage = ref("");
        const jsonError = ref("");
        const abortController = ref(null);

        // 计算属性：解析JSON输入
        const inputs = computed(() => {
            try {
                jsonError.value = "";
                return JSON.parse(inputsJson.value);
            } catch (error) {
                jsonError.value = "JSON格式错误: " + error.message;
                return {};
            }
        });

        // 发送请求
        const sendRequest = async () => {
            if (!apiKey.value) {
                statusMessage.value = "错误: 请提供API密钥";
                return;
            }

            isLoading.value = true;
            statusMessage.value = "正在发送请求...";
            responseData.value = "";

            // 创建中止控制器以便取消请求
            abortController.value = new AbortController();

            try {
                const response = await fetch(endpoint.value, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${apiKey.value}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        inputs: inputs.value,
                        response_mode: "streaming",
                        user: user.value,
                    }),
                    signal: abortController.value.signal,
                });

                if (!response.ok) {
                    throw new Error(`HTTP错误! 状态: ${response.status}`);
                }

                statusMessage.value = "正在接收流式响应...";

                // 处理流式响应
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        statusMessage.value = "请求完成";
                        break;
                    }

                    // 解码并添加数据
                    const chunk = decoder.decode(value, { stream: true });
                    responseData.value += chunk;
                }
            } catch (error) {
                if (error.name === "AbortError") {
                    statusMessage.value = "请求已取消";
                } else {
                    statusMessage.value = `错误: ${error.message}`;
                    console.error("请求失败:", error);
                }
            } finally {
                isLoading.value = false;
                abortController.value = null;
            }
        };

        // 清除响应
        const clearResponse = () => {
            responseData.value = "";
            statusMessage.value = "";
        };

        // 状态样式类
        const statusClass = computed(() => {
            if (statusMessage.value.includes("错误")) return "status-error";
            if (statusMessage.value.includes("完成")) return "status-success";
            return "status-info";
        });

        // 组件卸载时取消请求
        onUnmounted(() => {
            if (abortController.value) {
                abortController.value.abort();
            }
        });

        return {
            apiKey,
            endpoint,
            user,
            inputsJson,
            responseData,
            isLoading,
            statusMessage,
            jsonError,
            sendRequest,
            clearResponse,
            statusClass,
        };
    },
};
</script>

<style scoped>
.workflow-request {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    color: #333;
}

h2 {
    color: #2c3e50;
    border-bottom: 2px solid #eee;
    padding-bottom: 10px;
}

h3 {
    color: #34495e;
    margin-top: 0;
}

.config-section {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.form-group {
    margin-bottom: 15px;
}

label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
}

.form-input,
.form-textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
}

.form-textarea {
    min-height: 100px;
    font-family: monospace;
    resize: vertical;
}

.actions {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
}

.btn-primary {
    background-color: #3498db;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background-color: #2980b9;
}

.btn-secondary {
    background-color: #95a5a6;
    color: white;
}

.btn-secondary:hover:not(:disabled) {
    background-color: #7f8c8d;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.status {
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 20px;
    font-weight: 500;
}

.status-info {
    background-color: #d6eaf8;
    color: #2c3e50;
}

.status-success {
    background-color: #d5f4e6;
    color: #27ae60;
}

.status-error {
    background-color: #fadbd8;
    color: #c0392b;
}

.error-message {
    color: #e74c3c;
    font-size: 0.9em;
    margin-top: 5px;
}

.response-section {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.response-container {
    background: white;
    border: 1px solid #e1e4e8;
    border-radius: 4px;
    padding: 15px;
    min-height: 200px;
    max-height: 400px;
    overflow-y: auto;
}

.response-data {
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
    font-family: monospace;
    font-size: 14px;
    line-height: 1.4;
}

.empty-state {
    color: #7f8c8d;
    text-align: center;
    padding: 40px 0;
}
</style>
