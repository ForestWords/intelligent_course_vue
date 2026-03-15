<template>
    <div class="register-container">
        <div class="register-box">
            <h2 class="title">注册</h2>
            <el-input
                v-model="school"
                type="text"
                class="custom-input"
                auto-complete="off"
                placeholder="学校"
            >
                <template #prefix> </template>
            </el-input>
            <br /><br />
            <el-input
                v-if="usertype"
                v-model="section"
                type="text"
                class="custom-input"
                auto-complete="off"
                placeholder="班级"
            >
                <template #prefix v-if="usertype"> </template> </el-input
            ><br v-if="usertype" /><br v-if="usertype" />
            <el-input
                v-model="id"
                type="number"
                class="custom-input"
                auto-complete="off"
                placeholder="学号/工号"
            >
                <template #prefix> </template> </el-input
            ><br /><br />
            <el-input
                v-model="name"
                type="text"
                class="custom-input"
                auto-complete="off"
                placeholder="姓名"
            >
                <template #prefix> </template> </el-input
            ><br /><br />
            <el-input
                v-model="password"
                type="password"
                password
                auto-complete="off"
                placeholder="密码"
            >
                <template #prefix> </template>
            </el-input>
            <br /><br />

            <el-input
                v-model="password2"
                type="password"
                password
                auto-complete="off"
                placeholder="确认密码"
            >
                <template #prefix> </template> </el-input
            ><br /><br />
            <div v-for="id in identity" :key="id.value" class="input-group">
                <label>
                    <input
                        type="radio"
                        :value="id.value"
                        v-model="selectedIdentity"
                        @click="handleType"
                    />
                    {{ id.text }}
                </label>
            </div>
            <div class="button-group">
                <el-button type="success" @click="handleBack">返回</el-button>
                <el-button type="success" @click="handleRegister"
                    >注册</el-button
                >
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import axios from "axios";
import { ElMessage } from "element-plus";
import { ref } from "vue";
import { useRouter } from "vue-router";
const usertype = ref(false);
let name = ref("");
let id = ref("");
let password = ref("");
let password2 = ref("");
let school = ref("");
let section = ref("");
let router = useRouter();

const selectedIdentity = ref(null);
const identity = [
    { value: "student", text: "学生" },
    { value: "teacher", text: "老师" },
];

function handleType() {
    if (selectedIdentity.value == "student") {
        usertype.value = false;
    } else {
        usertype.value = true;
    }
}

function handleRegister() {
    if (
        id.value == "" ||
        name.value == "" ||
        password.value == "" ||
        school.value == ""
    ) {
        ElMessage.error("注册失败：学校、学号/工号、姓名和密码不能为空");
    } else {
        if (selectedIdentity.value != null) {
            if (password.value == password2.value) {
                if (selectedIdentity.value == "student") {
                    if (section.value == "") {
                        ElMessage.error("注册失败：班级不能为空");
                    } else {
                        let user = {
                            id: id.value,
                            name: name.value,
                            password: password.value,
                            type: selectedIdentity.value,
                            school: school.value,
                            section: section.value,
                        };
                        axios
                            .post(
                                "http://localhost:8082/register/student",
                                user
                            )
                            .then((res) => {
                                if (res.data == 0) {
                                    ElMessage.success("注册成功");
                                    router.push("/login");
                                }
                                if (res.data == 1) {
                                    ElMessage.error("注册失败");
                                }
                            });
                    }
                } else {
                    let user = {
                        id: id.value,
                        name: name.value,
                        password: password.value,
                        type: selectedIdentity.value,
                        school: school.value,
                    };
                    axios
                        .post("http://localhost:8082/register/teacher", user)
                        .then((res) => {
                            if (res.data == 0) {
                                ElMessage.success("注册成功");
                                router.push("/login");
                            }
                            if (res.data == 1) {
                                ElMessage.error("注册失败");
                            }
                        });
                }
            } else {
                ElMessage.error("注册失败：两次输入的密码不一致");
            }
        } else {
            ElMessage.error("注册失败：未选择身份");
        }
    }
}
function handleBack() {
    router.push("/login");
}
</script>

<style scoped>
.register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    background-image: url("../assets/images/login-background.jpg");
    background-size: cover;
    height: 100vh;
    background-color: #f5f5f5;
}
.title {
    margin: 0px auto 30px auto;
    text-align: center;
    color: #707070;
}
.register-box {
    width: 400px;
    background: #ffffff;
    padding: 25px;
    border-radius: 6px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.input-group {
    margin-bottom: 15px;
}

label {
    display: block;
    margin-bottom: 5px;
}

el-input {
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
}

el-button {
    width: 100%;
    padding: 10px;
    background-color: #105e81;
    color: white;
    border: none;
    cursor: pointer;
}

.button-group {
    display: flex;
    gap: 60px;
}

.button-group button {
    flex: 1;
    padding: 10px;
    background-color: #105e81;
    color: white;
    border: none;
    cursor: pointer;
}

button:hover {
    background-color: #3cb4ec;
}
</style>
