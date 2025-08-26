#!/bin/bash
# AssayBio 集成测试套件
# 端到端业务流程验证

set -euo pipefail

# ====================
# 配置和环境变量
# ====================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 测试配置
TEST_ENVIRONMENT="${TEST_ENVIRONMENT:-staging}"
BASE_URL="${BASE_URL:-http://localhost}"
TEST_TIMEOUT="${TEST_TIMEOUT:-60}"

# 测试结果目录
RESULTS_DIR="${SCRIPT_DIR}/results/integration_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ====================
# 日志函数
# ====================
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$RESULTS_DIR/integration.log"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$RESULTS_DIR/integration.log"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$RESULTS_DIR/integration.log"
    return 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$RESULTS_DIR/integration.log"
}

# ====================
# 用户旅程测试
# ====================

# 测试：访客浏览网站
test_visitor_journey() {
    log "Testing visitor journey..."
    local test_name="visitor_journey"
    local result_file="$RESULTS_DIR/${test_name}.json"
    
    local steps=(
        "/:homepage:首页访问"
        "/health:health_check:健康检查"
    )
    
    local journey_results=()
    local overall_status="passed"
    local start_time
    start_time=$(date +%s)
    
    for step in "${steps[@]}"; do
        local path="${step%%:*}"
        local remaining="${step#*:}"
        local step_name="${remaining%%:*}"
        local description="${remaining#*:}"
        
        info "Step: $description ($path)"
        
        local url="${BASE_URL}${path}"
        local response
        local http_code
        local response_time
        local content_length
        
        # 执行请求
        response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total};SIZE:%{size_download}" "$url" 2>/dev/null || echo "ERROR")
        
        if [[ "$response" == *"ERROR"* ]]; then
            error "Failed to access $path"
            journey_results+=('{"step":"'$step_name'","path":"'$path'","status":"failed","error":"request_failed"}')
            overall_status="failed"
            continue
        fi
        
        # 解析响应
        http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        response_time=$(echo "$response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
        content_length=$(echo "$response" | grep -o "SIZE:[0-9]*" | cut -d: -f2)
        response_body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*;TIME:[0-9.]*;SIZE:[0-9]*$//')
        
        # 验证响应
        local step_status="passed"
        local step_errors=()
        
        if [ "$http_code" != "200" ]; then
            step_status="failed"
            step_errors+=("http_${http_code}")
        fi
        
        if (( $(echo "$response_time > 5.0" | bc -l) )); then
            step_status="warning"
            step_errors+=("slow_response")
        fi
        
        # 内容验证
        case "$path" in
            "/")
                if ! echo "$response_body" | grep -qi "assaybio"; then
                    step_status="failed"
                    step_errors+=("missing_content")
                fi
                ;;
            "/health")
                if ! echo "$response_body" | grep -q "status"; then
                    step_status="failed"
                    step_errors+=("invalid_health_response")
                fi
                ;;
        esac
        
        # 记录步骤结果
        local step_result='{"step":"'$step_name'","path":"'$path'","description":"'$description'","status":"'$step_status'","http_code":'${http_code:-0}',"response_time":'${response_time:-0}',"content_length":'${content_length:-0}'}'
        
        if [ ${#step_errors[@]} -gt 0 ]; then
            step_result=$(echo "$step_result" | jq '.errors = ["'$(IFS='","'; echo "${step_errors[*]}")'""]')
        fi
        
        journey_results+=("$step_result")
        
        if [ "$step_status" = "failed" ]; then
            overall_status="failed"
            error "Step failed: $description"
        elif [ "$step_status" = "warning" ]; then
            warn "Step has issues: $description"
        else
            log "Step passed: $description (${response_time}s)"
        fi
        
        # 步骤间延迟模拟真实用户行为
        sleep 1
    done
    
    local end_time
    end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    # 创建测试结果
    local test_result='{
        "test": "visitor_journey",
        "status": "'$overall_status'",
        "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
        "total_duration": '$total_duration',
        "steps": ['
    test_result+=$(IFS=','; echo "${journey_results[*]}")
    test_result+=']}'
    
    echo "$test_result" | jq . > "$result_file"
    
    if [ "$overall_status" = "passed" ]; then
        log "Visitor journey completed successfully in ${total_duration}s"
        return 0
    else
        error "Visitor journey failed"
        return 1
    fi
}

# ====================
# API集成测试
# ====================
test_api_integration() {
    log "Testing API integration..."
    local test_name="api_integration"
    local result_file="$RESULTS_DIR/${test_name}.json"
    
    # API端点测试
    local api_endpoints=(
        "/health:GET:health_check:健康检查API"
        "/api/status:GET:status_api:状态API"
    )
    
    local api_results=()
    local overall_status="passed"
    
    for endpoint in "${api_endpoints[@]}"; do
        local path="${endpoint%%:*}"
        local remaining="${endpoint#*:}"
        local method="${remaining%%:*}"
        remaining="${remaining#*:}"
        local endpoint_name="${remaining%%:*}"
        local description="${remaining#*:}"
        
        info "Testing API: $description ($method $path)"
        
        local url="${BASE_URL}${path}"
        local response
        local http_code
        
        case "$method" in
            "GET")
                response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$url" 2>/dev/null || echo "ERROR")
                ;;
            "POST")
                response=$(curl -s -X POST -w "HTTPSTATUS:%{http_code}" "$url" 2>/dev/null || echo "ERROR")
                ;;
            *)
                warn "Unsupported HTTP method: $method"
                continue
                ;;
        esac
        
        if [[ "$response" == *"ERROR"* ]]; then
            error "API request failed: $path"
            api_results+=('{"endpoint":"'$endpoint_name'","path":"'$path'","method":"'$method'","status":"failed","error":"request_failed"}')
            overall_status="failed"
            continue
        fi
        
        http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        response_body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
        
        # 验证API响应
        local api_status="passed"
        local api_errors=()
        
        if [ "$http_code" != "200" ]; then
            api_status="failed"
            api_errors+=("http_${http_code}")
        fi
        
        # 验证JSON响应格式
        if [ "$path" = "/health" ]; then
            if ! echo "$response_body" | jq . >/dev/null 2>&1; then
                api_status="failed"
                api_errors+=("invalid_json")
            fi
        fi
        
        # 记录API结果
        local api_result='{"endpoint":"'$endpoint_name'","path":"'$path'","method":"'$method'","status":"'$api_status'","http_code":'${http_code:-0}'}'
        
        if [ ${#api_errors[@]} -gt 0 ]; then
            api_result=$(echo "$api_result" | jq '.errors = ["'$(IFS='","'; echo "${api_errors[*]}")'""]')
        fi
        
        api_results+=("$api_result")
        
        if [ "$api_status" = "failed" ]; then
            overall_status="failed"
            error "API test failed: $description"
        else
            log "API test passed: $description"
        fi
    done
    
    # 创建测试结果
    local test_result='{
        "test": "api_integration",
        "status": "'$overall_status'",
        "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
        "endpoints": ['
    test_result+=$(IFS=','; echo "${api_results[*]}")
    test_result+=']}'
    
    echo "$test_result" | jq . > "$result_file"
    
    if [ "$overall_status" = "passed" ]; then
        log "API integration tests passed"
        return 0
    else
        error "API integration tests failed"
        return 1
    fi
}

# ====================
# 跨浏览器兼容性测试（模拟）
# ====================
test_browser_compatibility() {
    log "Testing browser compatibility..."
    local test_name="browser_compatibility"
    local result_file="$RESULTS_DIR/${test_name}.json"
    
    # 模拟不同浏览器的User-Agent
    local browsers=(
        "Chrome:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        "Firefox:Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0"
        "Safari:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15"
        "Edge:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59"
        "Mobile:Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
    )
    
    local browser_results=()
    local overall_status="passed"
    
    for browser in "${browsers[@]}"; do
        local browser_name="${browser%%:*}"
        local user_agent="${browser#*:}"
        
        info "Testing with $browser_name"
        
        local url="${BASE_URL}/"
        local response
        local http_code
        local response_time
        
        response=$(curl -s -H "User-Agent: $user_agent" -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" "$url" 2>/dev/null || echo "ERROR")
        
        if [[ "$response" == *"ERROR"* ]]; then
            error "Request failed for $browser_name"
            browser_results+=('{"browser":"'$browser_name'","status":"failed","error":"request_failed"}')
            overall_status="failed"
            continue
        fi
        
        http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        response_time=$(echo "$response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
        response_body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*;TIME:[0-9.]*$//')
        
        # 验证响应
        local browser_status="passed"
        local browser_errors=()
        
        if [ "$http_code" != "200" ]; then
            browser_status="failed"
            browser_errors+=("http_${http_code}")
        fi
        
        # 检查响应内容
        if ! echo "$response_body" | grep -qi "html"; then
            browser_status="failed"
            browser_errors+=("no_html_content")
        fi
        
        # 记录浏览器结果
        local browser_result='{"browser":"'$browser_name'","status":"'$browser_status'","http_code":'${http_code:-0}',"response_time":'${response_time:-0}'}'
        
        if [ ${#browser_errors[@]} -gt 0 ]; then
            browser_result=$(echo "$browser_result" | jq '.errors = ["'$(IFS='","'; echo "${browser_errors[*]}")'""]')
        fi
        
        browser_results+=("$browser_result")
        
        if [ "$browser_status" = "failed" ]; then
            overall_status="failed"
            error "Browser compatibility test failed: $browser_name"
        else
            log "Browser compatibility test passed: $browser_name (${response_time}s)"
        fi
    done
    
    # 创建测试结果
    local test_result='{
        "test": "browser_compatibility",
        "status": "'$overall_status'",
        "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
        "browsers": ['
    test_result+=$(IFS=','; echo "${browser_results[*]}")
    test_result+=']}'
    
    echo "$test_result" | jq . > "$result_file"
    
    if [ "$overall_status" = "passed" ]; then
        log "Browser compatibility tests passed"
        return 0
    else
        error "Browser compatibility tests failed"
        return 1
    fi
}

# ====================
# 数据一致性测试
# ====================
test_data_consistency() {
    log "Testing data consistency..."
    local test_name="data_consistency"
    local result_file="$RESULTS_DIR/${test_name}.json"
    
    local consistency_checks=()
    local overall_status="passed"
    
    # 检查多次请求的一致性
    info "Checking response consistency across multiple requests..."
    
    local url="${BASE_URL}/health"
    local first_response
    local consistent=true
    
    first_response=$(curl -s "$url" 2>/dev/null || echo "ERROR")
    
    if [[ "$first_response" == *"ERROR"* ]]; then
        error "Failed to get initial response for consistency check"
        consistency_checks+=('{"check":"response_consistency","status":"failed","error":"initial_request_failed"}')
        overall_status="failed"
    else
        # 进行5次额外请求并比较
        for i in {1..5}; do
            local subsequent_response
            subsequent_response=$(curl -s "$url" 2>/dev/null || echo "ERROR")
            
            if [[ "$subsequent_response" == *"ERROR"* ]]; then
                warn "Request $i failed during consistency check"
                consistent=false
                break
            fi
            
            # 比较关键字段（如果是JSON）
            if echo "$first_response" | jq . >/dev/null 2>&1 && echo "$subsequent_response" | jq . >/dev/null 2>&1; then
                local first_status subsequent_status
                first_status=$(echo "$first_response" | jq -r '.status // "unknown"')
                subsequent_status=$(echo "$subsequent_response" | jq -r '.status // "unknown"')
                
                if [ "$first_status" != "$subsequent_status" ]; then
                    warn "Status field inconsistency detected: $first_status vs $subsequent_status"
                    consistent=false
                fi
            fi
            
            sleep 0.5
        done
        
        if $consistent; then
            log "Response consistency check passed"
            consistency_checks+=('{"check":"response_consistency","status":"passed"}')
        else
            warn "Response inconsistency detected"
            consistency_checks+=('{"check":"response_consistency","status":"warning","error":"inconsistent_responses"}')
        fi
    fi
    
    # 检查资源完整性
    info "Checking resource integrity..."
    
    local resources=(
        "/favicon.ico"
        "/css/"
        "/js/"
        "/images/"
    )
    
    local missing_resources=()
    for resource in "${resources[@]}"; do
        local resource_url="${BASE_URL}${resource}"
        local resource_response
        resource_response=$(curl -s -o /dev/null -w "%{http_code}" "$resource_url" 2>/dev/null || echo "ERROR")
        
        if [[ "$resource_response" == *"ERROR"* ]] || [ "$resource_response" = "404" ]; then
            missing_resources+=("$resource")
        fi
    done
    
    if [ ${#missing_resources[@]} -eq 0 ]; then
        log "All resources are accessible"
        consistency_checks+=('{"check":"resource_integrity","status":"passed"}')
    else
        warn "Some resources are missing: ${missing_resources[*]}"
        consistency_checks+=('{"check":"resource_integrity","status":"warning","missing_resources":["'$(IFS='","'; echo "${missing_resources[*]}")'"'"]}')
    fi
    
    # 创建测试结果
    local test_result='{
        "test": "data_consistency",
        "status": "'$overall_status'",
        "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
        "checks": ['
    test_result+=$(IFS=','; echo "${consistency_checks[*]}")
    test_result+=']}'
    
    echo "$test_result" | jq . > "$result_file"
    
    if [ "$overall_status" = "passed" ]; then
        log "Data consistency tests passed"
        return 0
    else
        error "Data consistency tests failed"
        return 1
    fi
}

# ====================
# 生成集成测试报告
# ====================
generate_integration_report() {
    log "Generating integration test report..."
    local report_file="$RESULTS_DIR/integration_report.json"
    local html_report="$RESULTS_DIR/integration_report.html"
    
    # 收集所有测试结果
    local all_results=()
    for result_file in "$RESULTS_DIR"/*.json; do
        if [ -f "$result_file" ] && [ "$(basename "$result_file")" != "integration_report.json" ]; then
            all_results+=("$(cat "$result_file")")
        fi
    done
    
    # 统计测试结果
    local total_tests=${#all_results[@]}
    local passed_tests=0
    local failed_tests=0
    local warning_tests=0
    
    for result in "${all_results[@]}"; do
        local status
        status=$(echo "$result" | jq -r '.status')
        case "$status" in
            "passed") ((passed_tests++)) ;;
            "failed") ((failed_tests++)) ;;
            "warning") ((warning_tests++)) ;;
        esac
    done
    
    local overall_status="passed"
    if [ $failed_tests -gt 0 ]; then
        overall_status="failed"
    elif [ $warning_tests -gt 0 ]; then
        overall_status="warning"
    fi
    
    # 创建JSON报告
    local json_report='{
        "test_suite": "AssayBio Integration Tests",
        "environment": "'$TEST_ENVIRONMENT'",
        "base_url": "'$BASE_URL'",
        "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
        "summary": {
            "overall_status": "'$overall_status'",
            "total_tests": '$total_tests',
            "passed": '$passed_tests',
            "failed": '$failed_tests',
            "warnings": '$warning_tests'
        },
        "results": ['
    json_report+=$(IFS=','; echo "${all_results[*]}")
    json_report+=']}'
    
    echo "$json_report" | jq . > "$report_file"
    
    log "Integration test report generated: $report_file"
    
    # 显示摘要
    echo ""
    echo "=========================================="
    echo "Integration Test Summary"
    echo "=========================================="
    echo "Environment: $TEST_ENVIRONMENT"
    echo "Overall Status: $overall_status"
    echo "Total Tests: $total_tests"
    echo "Passed: $passed_tests"
    echo "Failed: $failed_tests"
    echo "Warnings: $warning_tests"
    echo "=========================================="
    
    if [ "$overall_status" = "passed" ]; then
        return 0
    else
        return 1
    fi
}

# ====================
# 主函数
# ====================
main() {
    log "Starting AssayBio integration test suite"
    info "Environment: $TEST_ENVIRONMENT"
    info "Base URL: $BASE_URL"
    info "Results directory: $RESULTS_DIR"
    
    # 运行集成测试
    local integration_tests=(
        "test_visitor_journey"
        "test_api_integration"
        "test_browser_compatibility"
        "test_data_consistency"
    )
    
    local failed_tests=0
    
    for test_func in "${integration_tests[@]}"; do
        if ! $test_func; then
            ((failed_tests++))
        fi
    done
    
    # 生成报告
    if generate_integration_report; then
        log "Integration tests completed successfully"
        exit 0
    else
        error "Some integration tests failed"
        exit 1
    fi
}

# 运行集成测试套件
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi