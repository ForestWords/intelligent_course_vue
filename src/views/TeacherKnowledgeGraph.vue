<template>
    <div class="common-layout">
        <el-container>
            <el-header class="header"
                ><span>课程知识图谱</span>
                <span>
                    <el-button @click="graph_add()">新增</el-button>
                    <el-button @click="graph_update()">修改</el-button>
                    <el-button @click="dialogVisible = true">删除</el-button>
                    <el-button @click="graph_save" type="primary"
                        >保存</el-button
                    >
                </span>
            </el-header>
            <el-main><div id="container"></div></el-main>
        </el-container>
    </div>
    <el-drawer v-model="drawer" :direction="RTL">
        <template #header v-if="type">
            <h4>知识点修改</h4>
        </template>
        <template #header v-else>
            <h4>边修改</h4>
        </template>
        <template #default v-if="type">
            <div>
                <el-input
                    v-model="id"
                    type="text"
                    class="custom-input"
                    auto-complete="off"
                    placeholder="知识点名称"
                >
                </el-input>
                <el-input
                    v-model="description"
                    type="textarea"
                    class="custom-input"
                    auto-complete="off"
                    placeholder="描述"
                >
                </el-input>
                <el-select
                    v-model="resource_id"
                    placeholder="关联资源"
                    class="custom-input"
                >
                    <el-option
                        v-for="item in resource_options"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
                <el-select
                    v-model="task_id"
                    placeholder="关联任务点"
                    class="custom-input"
                >
                    <el-option
                        v-for="item in task_options"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </div>
        </template>
        <template #default v-else>
            <div>
                <el-input
                    v-model="id"
                    type="text"
                    class="custom-input"
                    auto-complete="off"
                    placeholder="边名称"
                >
                </el-input>
                <el-select
                    v-model="source"
                    placeholder="源节点"
                    class="custom-input"
                >
                    <el-option
                        v-for="item in node_options"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
                <el-select
                    v-model="target"
                    placeholder="目标节点"
                    class="custom-input"
                >
                    <el-option
                        v-for="item in node_options"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </div>
        </template>
        <template #footer>
            <div style="flex: auto">
                <el-button @click="cancelUpdate">取消</el-button>
                <el-button type="primary" @click="confirmUpdate"
                    >确定</el-button
                >
            </div>
        </template>
    </el-drawer>
    <el-drawer v-model="drawer_add" :direction="RTL">
        <template #header v-if="type">
            <h4>新增知识点</h4>
        </template>
        <template #header v-else>
            <h4>新增边</h4>
        </template>
        <template #default v-if="type">
            <div>
                <el-input
                    v-model="id"
                    type="text"
                    class="custom-input"
                    auto-complete="off"
                    placeholder="知识点名称"
                >
                </el-input>
                <el-input
                    v-model="description"
                    type="textarea"
                    class="custom-input"
                    auto-complete="off"
                    placeholder="描述"
                >
                </el-input>
                <el-select
                    v-model="resource_id"
                    placeholder="关联资源"
                    class="custom-input"
                >
                    <el-option
                        v-for="item in resource_options"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
                <el-select
                    v-model="task_id"
                    placeholder="关联任务点"
                    class="custom-input"
                >
                    <el-option
                        v-for="item in task_options"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </div>
        </template>
        <template #default v-else>
            <div>
                <el-input
                    v-model="id"
                    type="text"
                    class="custom-input"
                    auto-complete="off"
                    placeholder="边名称"
                >
                </el-input>
                <el-select
                    v-model="source"
                    placeholder="源节点"
                    class="custom-input"
                >
                    <el-option
                        v-for="item in node_options"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
                <el-select
                    v-model="target"
                    placeholder="目标节点"
                    class="custom-input"
                >
                    <el-option
                        v-for="item in node_options"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </div>
        </template>
        <template #footer>
            <div style="flex: auto">
                <el-switch
                    v-model="type"
                    active-text="新增知识点"
                    inactive-text="新增边"
                />&nbsp&nbsp
                <el-button @click="cancelAdd">取消</el-button>
                <el-button type="primary" @click="confirmAdd">确定</el-button>
            </div>
        </template>
    </el-drawer>
    <el-dialog v-model="dialogVisible" title="Tips" width="500">
        <span>确定要删除吗？</span>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="graph_delete">
                    确定
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
    Graph,
    NodeEvent,
    EdgeEvent,
    type NodeData,
    type EdgeData,
} from "@antv/g6";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";
import { RTL } from "element-plus/es/components/virtual-list/src/defaults.mjs";

interface KnowledgePoint {
    name: string;
    description: string;
    resource_id: number;
    course_id: number;
    task_id: number;
}

interface KnowledgeEdge {
    name: string;
    course_id: number;
    source: string;
    target: string;
}

interface Resource {
    id: number;
    name: string;
    type: string;
    path: string;
    course_id: number;
}

interface Task {
    id: number;
    description: string;
    type: string;
    name: string;
    deadline: string;
    course_id: number;
}

interface Data {
    description: string;
    course_id: number;
    resource_id: number;
    task_id: number;
}

const re_knowledge_points = ref<KnowledgePoint[]>([]);
const re_knowledge_edges = ref<KnowledgeEdge[]>([]);
const re_resource = ref<Resource[]>([]);
const re_task = ref<Task[]>([]);

let route = useRoute();
const drawer = ref(false);
const drawer_add = ref(false);
const dialogVisible = ref(false);
const type = ref<boolean>();

const id = ref<string>();
const description = ref<string>();
const resource_id = ref<number>();
const task_id = ref<number>();
const source = ref<string>();
const target = ref<string>();

const resource_options: any[] = [];
const task_options: any[] = [];
const node_options: any[] = [];

const edge_out = ref<EdgeData>();
const point_out = ref<NodeData>();
const data_out = ref<Data>();
const graph_out = ref<Graph>();

const show = async () => {
    try {
        const params = new URLSearchParams();
        params.append("s_course_id", route.params.cid);

        const response_edge = await axios.post(
            "http://localhost:8082/show_edge",
            params
        );
        const response_point = await axios.post(
            "http://localhost:8082/show_point",
            params
        );

        re_knowledge_edges.value = response_edge.data;
        re_knowledge_points.value = response_point.data;
        initGraph();
    } catch (error) {
        ElMessage.error("请求图谱数据失败，请检查网络连接");
    }
};

const graph_add = async () => {
    try {
        const params = new URLSearchParams();
        params.append("s_course_id", route.params.cid);
        const response_resource = await axios.post(
            "http://localhost:8082/resource_list",
            params
        );

        const response_task = await axios.post(
            "http://localhost:8082/task_list",
            params
        );

        re_resource.value = response_resource.data;
        re_task.value = response_task.data;
        console.log(re_task.value);

        resource_options.length = 0;
        task_options.length = 0;

        for (const resource of re_resource.value) {
            resource_options.push({
                value: resource.id,
                label: resource.name,
            });
        }

        task_options.push({
            value: 0,
            label: "无",
        });

        for (const task of re_task.value) {
            console.log(task);
            task_options.push({
                value: task.id,
                label: task.name,
            });
        }
    } catch (error) {
        ElMessage.error("请求任务和资源失败，请检查网络连接");
    }

    node_options.length = 0;
    for (const node of graph_out.value?.getNodeData()) {
        node_options.push({
            value: node.id,
            label: node.id,
        });
    }

    drawer_add.value = true;
};

const addNode = async () => {
    const newNode: any = {
        id: id.value,
        data: {
            description: description.value,
            course_id: Number(route.params.cid),
            resource_id: resource_id.value,
            task_id: task_id.value | 0,
        },
    };
    graph_out.value?.addNodeData([newNode]);
};

const addEdge = async () => {
    const newEdge: any = {
        id: id.value,
        source: source.value,
        target: target.value,
    };
    graph_out.value?.addEdgeData([newEdge]);
};

const graph_update = async () => {
    if (type.value) {
        updateNode();
    } else {
        updateEdge();
    }
    drawer.value = true;
};

const updateNode = async () => {
    id.value = point_out.value?.id;
    data_out.value = point_out.value?.data;
    description.value = data_out.value?.description;
    try {
        const params = new URLSearchParams();
        //params.append("s_course_id", point.value.course_ID.toString());
        params.append("s_course_id", route.params.cid);
        const response_resource = await axios.post(
            "http://localhost:8082/resource_list",
            params
        );

        const response_task = await axios.post(
            "http://localhost:8082/task_list",
            params
        );

        re_resource.value = response_resource.data;
        re_task.value = response_task.data;
        console.log(re_task.value);

        resource_options.length = 0;
        task_options.length = 0;

        for (const resource of re_resource.value) {
            resource_options.push({
                value: resource.id,
                label: resource.name,
            });
        }

        for (const task of re_task.value) {
            console.log(task);
            task_options.push({
                value: task.id,
                label: task.name,
            });
        }

        resource_id.value = data_out.value?.resource_id;
        task_id.value = data_out.value?.task_id;
    } catch (error) {
        ElMessage.error("请求任务和资源失败，请检查网络连接");
    }
};

const updateEdge = async () => {
    id.value = edge_out.value?.id;
    source.value = edge_out.value?.source;
    target.value = edge_out.value?.target;
    console.log(graph_out.value);

    node_options.length = 0;
    for (const node of graph_out.value?.getNodeData()) {
        node_options.push({
            value: node.id,
            label: node.id,
        });
    }

    resource_id.value = data_out.value?.resource_id;
    task_id.value = data_out.value?.task_id;
};

const graph_delete = async () => {
    if (type.value) {
        deleteNode();
    } else {
        deleteEdge();
    }
    dialogVisible.value = false;
};

const deleteNode = async () => {
    graph_out.value?.removeNodeData([point_out.value?.id]);
    console.log(graph_out.value?.getEdgeData());
};

const deleteEdge = async () => {
    graph_out.value?.removeEdgeData([edge_out.value?.id]);
};

const graph_save = async () => {
    re_knowledge_edges.value.length = 0;
    re_knowledge_points.value.length = 0;

    for (const knowledge_edge of graph_out.value?.getEdgeData()) {
        re_knowledge_edges.value.push({
            name: knowledge_edge.id,
            course_id: Number(route.params.cid),
            source: knowledge_edge.source,
            target: knowledge_edge.target,
        });
    }
    for (const knowledge_point of graph_out.value?.getNodeData()) {
        point_out.value = knowledge_point;
        data_out.value = point_out.value.data;
        re_knowledge_points.value.push({
            name: knowledge_point.id,
            description: data_out.value?.description,
            resource_id: data_out.value?.resource_id,
            course_id: data_out.value?.course_id,
            task_id: data_out.value?.task_id,
        });
    }
    console.log(re_knowledge_edges.value);
    console.log(re_knowledge_points.value);

    try {
        axios
            .post("http://localhost:8082/save_edge", re_knowledge_edges.value)
            .then((res) => {
                if (res.data == 0) {
                    ElMessage.success("保存成功");
                }
                if (res.data == 1) {
                    ElMessage.error("保存失败");
                }
            });
        axios
            .post("http://localhost:8082/save_point", re_knowledge_points.value)
            .then((res) => {
                if (res.data == 0) {
                    ElMessage.success("保存成功");
                }
                if (res.data == 1) {
                    ElMessage.error("保存失败");
                }
            });
    } catch (error) {
        ElMessage.error("保存图谱数据失败，请检查网络连接");
    }
};

const checkDuplicateNodeId = (id: string): boolean => {
    if (!graph_out.value || !id) return false;

    const existingNodeIds = graph_out.value
        .getNodeData()
        .map((node) => node.id);

    return existingNodeIds.includes(id);
};

const checkDuplicateEdgeId = (id: string): boolean => {
    if (!graph_out.value || !id) return false;

    const existingEdgeIds = graph_out.value
        .getEdgeData()
        .map((edge) => edge.id);

    return existingEdgeIds.includes(id);
};

const checkDuplicateId = (id: string): boolean => {
    return checkDuplicateNodeId(id) || checkDuplicateEdgeId(id);
};

function cancelUpdate() {
    drawer.value = false;
}

function confirmUpdate() {
    if (!id.value) {
        ElMessage.error("请输入名称");
        return;
    }

    if (!resource_id.value && type.value) {
        ElMessage.error("请选择关联资源");
        return;
    }

    // 在确认前再次检查
    // if (type.value && checkDuplicateId(id.value)) {
    //     ElMessage.error(`存在节点或边的名称为 “${id.value}” ，请使用其他名称`);
    //     return;
    // }
    // if (!type.value && checkDuplicateId(id.value)) {
    //     for (let i = 1; ; i++) {
    //         id.value = id.value + "_" + i.toString();
    //         if (!checkDuplicateId(id.value)) {
    //             ElMessage.error(
    //                 `边的名称修改为为 “${id.value}” ，请使用其他名称`
    //             );
    //             break;
    //         }
    //     }
    // }

    ElMessageBox.confirm(`确定要更新吗？`)
        .then(() => {
            if (type.value) {
                graph_out.value?.updateNodeData([
                    {
                        id: id.value,
                        data: {
                            description: description.value,
                            course_id: Number(route.params.cid),
                            resource_id: resource_id.value,
                            task_id: task_id.value | 0,
                        },
                    },
                ]);
            } else {
                graph_out.value?.updateEdgeData([
                    {
                        id: id.value,
                        source: source.value,
                        target: target.value,
                    },
                ]);
            }
            drawer.value = false;
        })
        .catch(() => {
            // catch error
        });
}

function cancelAdd() {
    drawer_add.value = false;
}

function confirmAdd() {
    if (!id.value) {
        ElMessage.error("请输入名称");
        return;
    }

    if (!resource_id.value && type.value) {
        ElMessage.error("请选择关联资源");
        return;
    }

    // 在确认前再次检查
    if (type.value && checkDuplicateId(id.value)) {
        ElMessage.error(`存在节点或边的名称为 “${id.value}” ，请使用其他名称`);
        return;
    }
    if (!type.value && checkDuplicateId(id.value)) {
        for (let i = 1; ; i++) {
            id.value = id.value + "_" + i.toString();
            if (!checkDuplicateId(id.value)) {
                ElMessage.info(`边的名称已修改为 “${id.value}”`);
                break;
            }
        }
    }

    ElMessageBox.confirm(`确定要更新吗？`)
        .then(() => {
            if (type.value) {
                addNode();
            } else {
                addEdge();
            }
            drawer_add.value = false;
        })
        .catch(() => {
            // catch error
        });
}

const initGraph = () => {
    const graph = new Graph({
        container: document.getElementById("container")!,
        // width: 800, // 增加宽度以便更好地显示
        height: 700,
        layout: {
            type: "circular",
        },
        node: {
            style: {
                labelText: (d: any) => d.id,
                fill: "#9ec9ff",
                lineWidth: 0,
            },
        },
        edge: {
            style: {
                labelText: (d: any) => d.id,
                stroke: "#b5b5b5",
            },
        },
        behaviors: [
            "drag-canvas",
            "zoom-canvas",
            "drag-element",
            "click-select",
        ],
        plugins: [
            {
                type: "tooltip",
                getContent: (e: any, items: any) => {
                    console.log(items[0]);
                    return `
          <div>
            <div style="color: #0c4a6e;">
              知识点名称: ${items[0].id}<br/>
              描述: ${items[0].data?.description || "无"}<br/>
              关联资源: ${items[0].data?.resource_id || "无"}<br/>
              关联任务点: ${items[0].data?.task_id || "无"}
            </div>
          </div>
        `;
                },
            },
        ],
        autoFit: {
            type: "view", // 自适应类型：'view' 或 'center'
            options: {
                // 仅适用于 'view' 类型
                when: "overflow", // 何时适配：'overflow'(仅当内容溢出时) 或 'always'(总是适配)
                direction: "both", // 适配方向：'x'、'y' 或 'both'
            },
            animation: {
                // 自适应动画效果
                duration: 1000, // 动画持续时间(毫秒)
                easing: "ease-in-out", // 动画缓动函数
            },
        },
        autoResize: true,
    });

    const nodeData: any[] = [];
    console.log("知识点数据:", re_knowledge_points.value);

    for (const knowledge_point of re_knowledge_points.value) {
        console.log("添加节点:", knowledge_point.name);
        nodeData.push({
            id: knowledge_point.name,
            data: {
                description: knowledge_point.description,
                course_id: knowledge_point.course_ID,
                resource_id: knowledge_point.resource_ID,
                task_id: knowledge_point.task_ID,
            },
        });
    }

    const edgeData: any[] = [];
    console.log("边数据:", re_knowledge_edges.value);

    for (const knowledge_edge of re_knowledge_edges.value) {
        edgeData.push({
            id: knowledge_edge.name,
            source: knowledge_edge.source,
            target: knowledge_edge.target,
        });
    }

    if (nodeData.length > 0) {
        graph.addNodeData(nodeData);
    }

    if (edgeData.length > 0) {
        graph.addEdgeData(edgeData);
    }

    // 监听节点点击
    graph.on(NodeEvent.CLICK, (evt) => {
        const { target } = evt;

        type.value = true;

        point_out.value = graph.getNodeData(target.id);
    });

    graph.on(EdgeEvent.CLICK, (evt) => {
        const { target } = evt;

        type.value = false;

        edge_out.value = graph.getEdgeData(target.id);
    });
    graph_out.value = graph;
    graph.render();
};

onMounted(() => {
    show();
});
</script>

<style scoped>
.header {
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between; /* 添加这行 */
    color: #00aeec;
    padding: 6px;
    border-radius: 4px;
    background-color: #fff; /* 与菜单背景色相同 */
    font-size: 20px; /* 增大字体大小 */
    font-weight: 600; /* 增加字体粗细，使其更醒目 */
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
}

.custom-input {
    margin-bottom: 20px;
    transition: all 0.3s ease;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 0px 0px;
}
</style>
