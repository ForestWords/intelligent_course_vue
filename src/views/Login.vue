<template>
    <div class="login-container">
        <div class="login">
            <el-form class="login-form">
                <h3 class="title">{{ title }}</h3>
                <el-input
                    v-model="school"
                    type="text"
                    class="custom-input"
                    auto-complete="off"
                    placeholder="学校"
                >
                </el-input>
                <el-input
                    v-model="id"
                    type="number"
                    class="custom-input"
                    auto-complete="off"
                    placeholder="账号"
                >
                </el-input>
                <el-input
                    v-model="password"
                    type="password"
                    auto-complete="off"
                    class="custom-input2"
                    placeholder="密码"
                    @keyup.enter="handleLogin"
                >
                </el-input>
                <el-form-item style="width: 100%">
                    <el-button
                        :loading="loading"
                        size="medium"
                        type="primary"
                        style="width: 100%"
                        class="login-button"
                        @click.prevent="handleLogin"
                    >
                        <span v-if="!loading" class="loading">登 录</span>
                        <span v-else>登 录 中...</span>
                    </el-button>
                    <div>
                        <router-link class="link-type" :to="'/register'"
                            >立即注册</router-link
                        >
                    </div>
                </el-form-item>
            </el-form>
            <!-- 底部 -->
            <div class="el-login-footer">
                <!-- 底部内容 -->
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";

interface User {
    id: number;
    password: string;
    school: string;
    name: string;
    type: string;
}

const re_user = ref<User>();

let title = ref("智慧课程系统");
let school = ref("");
let id = ref(null);
let password = ref("");
let loading = ref(false);
let errorMessage = ref("");
let router = useRouter();

const handleLogin = async () => {
    loading.value = true;
    try {
        let user = {
            id: id.value,
            password: password.value,
            school: school.value,
        };
        axios.post("http://localhost:8082/login", user).then((res) => {
            re_user.value = res.data;
            if (res.data == 0) {
                errorMessage.value = "学校或账号或密码不正确";
                ElMessage.error("学校或账号或密码不正确");
            } else {
                ElMessage.success("登录成功");

                // 存储用户信息到本地存储
                localStorage.setItem(
                    "currentUser",
                    JSON.stringify({
                        id: id.value,
                        name: re_user.value?.name,
                        password: password.value,
                        school: school.value,
                        type: re_user.value?.type,
                    })
                );

                // 根据用户类型跳转
                const routeName =
                    re_user.value?.type === "student"
                        ? "student_course"
                        : "teacher_course";
                setTimeout(
                    () =>
                        router.push({
                            name: routeName,
                            params: { school: school.value, uid: id.value },
                        }),
                    1000
                );
            }
        });
    } catch (error) {
        errorMessage.value = "登录请求失败，请检查网络连接";
        ElMessage.error("登录请求失败，请检查网络连接");
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped lang="scss">
.login-container {
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-image: url("../assets/images/login-background.jpg");
    background-size: cover;
}

.login {
    width: 400px;
    background: #ffffff;
    padding: 25px;
    border-radius: 6px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .title {
        margin: 0px auto 30px auto;
        text-align: center;
        color: #707070;
    }
    .custom-input2 {
        margin-bottom: 20px;
        transition: all 0.3s ease;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        padding: 0px 0px;
    }
    .custom-input {
        margin-bottom: 20px;
        transition: all 0.3s ease;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        padding: 0px 0px;
    }
    .login-form {
        .el-input {
            width: 100%;

            height: 38px;
            :deep(input) {
                width: 100%;

                height: 38px;
            }
        }
        .input-icon {
            height: 39px;
            width: 14px;

            margin-left: 2px;
        }
    }
    .loading {
        color: #ffffff;
    }
    .login-tip {
        font-size: 13px;
        text-align: center;
        color: #bfbfbf;
    }
    .login-button {
        width: 100%;
        margin-top: 20px;
        background-color: #105e81;
        border-color: #105e81;
        transition: all 0.3s ease;
    }
    .login-code {
        width: 33%;
        height: 38px;
        float: right;

        img {
            cursor: pointer;
            vertical-align: middle;
        }
    }

    .el-login-footer {
        height: 40px;
        line-height: 40px;
        position: fixed;
        bottom: 0;
        width: 100%;
        text-align: center;
        color: #fff;
        font-family: Arial;
        font-size: 12px;
        letter-spacing: 1px;
    }

    .login-code-img {
        height: 38px;
    }
}
</style>
