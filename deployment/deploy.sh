#!/bin/bash

# AssayBio 一键部署脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：打印带颜色的消息
print_status() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查Git状态
check_git_status() {
    print_status "检查Git状态..."
    
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "有未提交的更改:"
        git status --short
        echo ""
        read -p "是否继续部署? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "部署已取消"
            exit 1
        fi
    fi
}

# 运行测试（如果存在）
run_tests() {
    if [ -f "package.json" ] && [ -n "$(npm run | grep test)" ]; then
        print_status "运行测试..."
        npm test || {
            print_error "测试失败！"
            read -p "是否忽略测试继续部署? (y/N): " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        }
        print_success "测试通过"
    fi
}

# 部署函数
deploy_to_env() {
    local env=$1
    local remote=$2
    local branch=${3:-main}
    
    print_status "开始部署到 $env 环境..."
    
    # 检查远程仓库是否存在
    if ! git remote get-url $remote >/dev/null 2>&1; then
        print_error "远程仓库 '$remote' 不存在!"
        print_status "请先运行: git remote add $remote user@server:/path/to/repo.git"
        exit 1
    fi
    
    # 推送代码
    print_status "推送代码到 $remote..."
    git push $remote $branch
    
    print_success "部署到 $env 环境完成！"
}

# 主函数
main() {
    echo ""
    echo "🚀 AssayBio 自动部署工具"
    echo "=========================="
    echo ""
    
    # 检查当前分支
    CURRENT_BRANCH=$(git branch --show-current)
    print_status "当前分支: $CURRENT_BRANCH"
    
    # 检查Git状态
    check_git_status
    
    # 运行测试
    run_tests
    
    # 选择部署环境
    echo ""
    echo "请选择部署环境:"
    echo "1) 生产环境 (production)"
    echo "2) 开发环境 (staging)"
    echo "3) 自定义环境"
    echo "0) 取消"
    echo ""
    read -p "请选择 [1-3,0]: " choice
    
    case $choice in
        1)
            deploy_to_env "生产" "production" "$CURRENT_BRANCH"
            ;;
        2)
            deploy_to_env "开发" "staging" "$CURRENT_BRANCH"
            ;;
        3)
            read -p "请输入远程仓库名: " custom_remote
            read -p "请输入分支名 (默认: $CURRENT_BRANCH): " custom_branch
            custom_branch=${custom_branch:-$CURRENT_BRANCH}
            deploy_to_env "自定义" "$custom_remote" "$custom_branch"
            ;;
        0)
            print_status "部署已取消"
            exit 0
            ;;
        *)
            print_error "无效选择"
            exit 1
            ;;
    esac
    
    echo ""
    print_success "🎉 部署完成！"
    print_status "请检查网站是否正常运行"
    echo ""
}

# 脚本入口
main "$@"