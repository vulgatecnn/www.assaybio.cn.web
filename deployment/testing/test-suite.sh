#!/bin/bash
# AssayBio 自动化测试套件
# 企业级质量保证测试流程

set -euo pipefail

# ====================
# 配置和环境变量
# ====================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 测试配置
TEST_ENVIRONMENT="${TEST_ENVIRONMENT:-staging}"
BASE_URL="${BASE_URL:-http://localhost}"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-/health}"
TEST_TIMEOUT="${TEST_TIMEOUT:-300}"
PARALLEL_TESTS="${PARALLEL_TESTS:-4}"

# 测试结果目录
RESULTS_DIR="${SCRIPT_DIR}/results/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ====================
# 日志和工具函数
# ====================
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$RESULTS_DIR/test.log"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$RESULTS_DIR/test.log"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$RESULTS_DIR/test.log"
    return 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$RESULTS_DIR/test.log"
}

# 检查必需工具
check_tools() {
    local tools=("curl" "jq" "timeout")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error "$tool is required but not installed"
        fi
    done
    log "All required tools are available"
}

# ====================
# 基础健康检查测试
# ====================
test_health_check() {
    log "Running health check tests..."
    local test_name="health_check"
    local result_file="$RESULTS_DIR/${test_name}.json"
    
    # 基础健康检查
    local health_url="${BASE_URL}${HEALTH_ENDPOINT}"
    local response
    local http_code
    local response_time
    
    info "Testing health endpoint: $health_url"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" "$health_url" || echo "ERROR")
    
    if [[ "$response" == *"ERROR"* ]]; then
        error "Health check request failed"
        echo '{"test":"health_check","status":"failed","error":"request_failed"}' > "$result_file"
        return 1
    fi
    
    http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    response_time=$(echo "$response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
    response_body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*;TIME:[0-9.]*$//')
    
    # 创建测试结果
    local test_result='{
        "test": "health_check",
        "status": "unknown",
        "http_code": '${http_code:-0}',
        "response_time": '${response_time:-0}',
        "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
        "endpoint": "'$health_url'"
    }'
    
    # 验证结果
    if [ "$http_code" = "200" ]; then
        # 尝试解析JSON响应
        if echo "$response_body" | jq . > /dev/null 2>&1; then
            log "Health check passed (HTTP 200, valid JSON, ${response_time}s)"
            test_result=$(echo "$test_result" | jq '.status = "passed"')
            echo "$test_result" > "$result_file"
            return 0
        else
            warn "Health check returned 200 but invalid JSON"
            test_result=$(echo "$test_result" | jq '.status = "warning" | .error = "invalid_json"')
            echo "$test_result" > "$result_file"
            return 0
        fi
    else
        error "Health check failed with HTTP $http_code"
        test_result=$(echo "$test_result" | jq '.status = "failed" | .error = "http_error"')
        echo "$test_result" > "$result_file"
        return 1
    fi
}

# ====================
# 页面可访问性测试
# ====================
test_page_accessibility() {
    log "Running page accessibility tests..."
    local test_name="page_accessibility"
    local result_file="$RESULTS_DIR/${test_name}.json"
    
    local pages=(
        "/"
        "/health"
    )
    
    local results=()
    local overall_status="passed"
    
    for page in "${pages[@]}"; do
        local url="${BASE_URL}${page}"
        info "Testing page: $url"
        
        local response
        local http_code
        local response_time
        
        response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" "$url" || echo "ERROR")
        
        if [[ "$response" == *"ERROR"* ]]; then
            warn "Failed to access $url"
            results+=('{"url":"'$url'","status":"failed","error":"request_failed"}')
            overall_status="failed"
            continue
        fi
        
        http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        response_time=$(echo "$response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
        
        if [ "$http_code" = "200" ]; then
            log "Page $url accessible (${response_time}s)"
            results+=('{"url":"'$url'","status":"passed","http_code":'$http_code',"response_time":'$response_time'}')
        else
            warn "Page $url returned HTTP $http_code"
            results+=('{"url":"'$url'","status":"failed","http_code":'$http_code',"error":"http_error"}')
            overall_status="failed"
        fi
    done
    
    # 创建测试结果
    local test_result='{"test":"page_accessibility","status":"'$overall_status'","timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'","results":['
    test_result+=$(IFS=','; echo "${results[*]}")
    test_result+=']}'
    
    echo "$test_result" | jq . > "$result_file"
    
    if [ "$overall_status" = "passed" ]; then
        log "All pages are accessible"
        return 0
    else
        error "Some pages are not accessible"
        return 1
    fi
}

# ====================
# 性能测试
# ====================
test_performance() {
    log "Running performance tests..."
    local test_name="performance"
    local result_file="$RESULTS_DIR/${test_name}.json"
    
    local url="${BASE_URL}/"
    local concurrent_users=10
    local test_duration=30
    local max_response_time=2.0
    
    info "Performance testing $url with $concurrent_users concurrent users for ${test_duration}s"
    
    # 创建临时测试脚本
    local perf_script="/tmp/perf_test.sh"
    cat > "$perf_script" << EOF
#!/bin/bash
url="$url"
requests=0
total_time=0
max_time=0
min_time=999
errors=0

end_time=\$((SECONDS + $test_duration))

while [ \$SECONDS -lt \$end_time ]; do
    response=\$(curl -s -w "TIME:%{time_total};CODE:%{http_code}" "\$url" 2>/dev/null || echo "ERROR")
    
    if [[ "\$response" == *"ERROR"* ]]; then
        ((errors++))
        continue
    fi
    
    time=\$(echo "\$response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
    code=\$(echo "\$response" | grep -o "CODE:[0-9]*" | cut -d: -f2)
    
    if [ "\$code" != "200" ]; then
        ((errors++))
        continue
    fi
    
    ((requests++))
    total_time=\$(echo "\$total_time + \$time" | bc -l)
    
    if (( \$(echo "\$time > \$max_time" | bc -l) )); then
        max_time=\$time
    fi
    
    if (( \$(echo "\$time < \$min_time" | bc -l) )); then
        min_time=\$time
    fi
done

avg_time=\$(echo "scale=3; \$total_time / \$requests" | bc -l)
rps=\$(echo "scale=2; \$requests / $test_duration" | bc -l)

echo "{\\"requests\\":\$requests,\\"avg_time\\":\$avg_time,\\"max_time\\":\$max_time,\\"min_time\\":\$min_time,\\"rps\\":\$rps,\\"errors\\":\$errors}"
EOF
    
    chmod +x "$perf_script"
    
    # 并发运行性能测试
    local pids=()
    local temp_results=()
    
    for i in $(seq 1 $concurrent_users); do
        local temp_file="/tmp/perf_result_$i"
        "$perf_script" > "$temp_file" &
        pids+=($!)
        temp_results+=("$temp_file")
    done
    
    # 等待所有测试完成
    for pid in "${pids[@]}"; do
        wait "$pid"
    done
    
    # 汇总结果
    local total_requests=0
    local total_avg_time=0
    local total_errors=0
    local max_response_time_recorded=0
    
    for temp_file in "${temp_results[@]}"; do
        if [ -f "$temp_file" ]; then
            local result
            result=$(cat "$temp_file")
            
            local requests max_time errors
            requests=$(echo "$result" | jq -r '.requests')
            max_time=$(echo "$result" | jq -r '.max_time')
            errors=$(echo "$result" | jq -r '.errors')
            
            total_requests=$((total_requests + requests))
            total_errors=$((total_errors + errors))
            
            if (( $(echo "$max_time > $max_response_time_recorded" | bc -l) )); then
                max_response_time_recorded=$max_time
            fi
            
            rm -f "$temp_file"
        fi
    done
    
    local total_rps
    total_rps=$(echo "scale=2; $total_requests / $test_duration" | bc -l)
    
    # 判断性能测试是否通过
    local status="passed"
    if (( $(echo "$max_response_time_recorded > $max_response_time" | bc -l) )); then
        status="failed"
    fi
    
    if [ $total_errors -gt 0 ]; then
        status="failed"
    fi
    
    # 创建测试结果
    local test_result='{
        "test": "performance",
        "status": "'$status'",
        "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
        "duration": '$test_duration',
        "concurrent_users": '$concurrent_users',
        "total_requests": '$total_requests',
        "total_errors": '$total_errors',
        "requests_per_second": '$total_rps',
        "max_response_time": '$max_response_time_recorded',
        "max_allowed_response_time": '$max_response_time'
    }'
    
    echo "$test_result" | jq . > "$result_file"
    
    if [ "$status" = "passed" ]; then
        log "Performance test passed (${total_rps} RPS, max ${max_response_time_recorded}s)"
        return 0
    else
        error "Performance test failed"
        return 1
    fi
    
    # 清理
    rm -f "$perf_script"
}

# ====================
# 安全测试
# ====================
test_security() {
    log "Running security tests..."
    local test_name="security"
    local result_file="$RESULTS_DIR/${test_name}.json"
    
    local results=()
    local overall_status="passed"
    
    # 测试安全头部
    info "Checking security headers..."
    local headers_response
    headers_response=$(curl -s -I "${BASE_URL}/" 2>/dev/null || echo "ERROR")
    
    if [[ "$headers_response" == *"ERROR"* ]]; then
        warn "Failed to check security headers"
        results+=('{"test":"security_headers","status":"failed","error":"request_failed"}')
        overall_status="failed"
    else
        local required_headers=(
            "X-Content-Type-Options"
            "X-Frame-Options"
            "X-XSS-Protection"
        )
        
        local missing_headers=()
        for header in "${required_headers[@]}"; do
            if ! echo "$headers_response" | grep -qi "^$header:"; then
                missing_headers+=("$header")
            fi
        done
        
        if [ ${#missing_headers[@]} -eq 0 ]; then
            log "All required security headers present"
            results+=('{"test":"security_headers","status":"passed"}')
        else
            warn "Missing security headers: ${missing_headers[*]}"
            results+=('{"test":"security_headers","status":"warning","missing_headers":["'$(IFS='","'; echo "${missing_headers[*]}")"'"]}')
        fi
    fi
    
    # 测试HTTPS重定向（如果在生产环境）
    if [ "$TEST_ENVIRONMENT" = "production" ]; then
        info "Checking HTTPS redirect..."
        local http_url="http://www.assaybio.com/"
        local redirect_response
        redirect_response=$(curl -s -I "$http_url" 2>/dev/null || echo "ERROR")
        
        if [[ "$redirect_response" == *"ERROR"* ]]; then
            warn "Failed to check HTTPS redirect"
            results+=('{"test":"https_redirect","status":"failed","error":"request_failed"}')
            overall_status="failed"
        else
            local http_code
            http_code=$(echo "$redirect_response" | head -1 | cut -d' ' -f2)
            
            if [ "$http_code" = "301" ] || [ "$http_code" = "302" ]; then
                if echo "$redirect_response" | grep -qi "location:.*https://"; then
                    log "HTTPS redirect working correctly"
                    results+=('{"test":"https_redirect","status":"passed"}')
                else
                    warn "HTTP redirects but not to HTTPS"
                    results+=('{"test":"https_redirect","status":"warning","error":"not_https"}')
                fi
            else
                warn "HTTP does not redirect to HTTPS"
                results+=('{"test":"https_redirect","status":"warning","error":"no_redirect"}')
            fi
        fi
    fi
    
    # 测试敏感文件暴露
    info "Checking for exposed sensitive files..."
    local sensitive_files=(
        "/.env"
        "/config.json"
        "/.git/config"
        "/admin"
        "/phpmyadmin"
    )
    
    local exposed_files=()
    for file in "${sensitive_files[@]}"; do
        local file_response
        file_response=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${file}" 2>/dev/null || echo "ERROR")
        
        if [ "$file_response" = "200" ]; then
            exposed_files+=("$file")
        fi
    done
    
    if [ ${#exposed_files[@]} -eq 0 ]; then
        log "No sensitive files exposed"
        results+=('{"test":"sensitive_files","status":"passed"}')
    else
        error "Sensitive files exposed: ${exposed_files[*]}"
        results+=('{"test":"sensitive_files","status":"failed","exposed_files":["'$(IFS='","'; echo "${exposed_files[*]}")"'"]}')
        overall_status="failed"
    fi
    
    # 创建测试结果
    local test_result='{"test":"security","status":"'$overall_status'","timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'","results":['
    test_result+=$(IFS=','; echo "${results[*]}")
    test_result+=']}'
    
    echo "$test_result" | jq . > "$result_file"
    
    if [ "$overall_status" = "passed" ]; then
        log "Security tests passed"
        return 0
    else
        error "Security tests failed"
        return 1
    fi
}

# ====================
# 内容验证测试
# ====================
test_content_validation() {
    log "Running content validation tests..."
    local test_name="content_validation"
    local result_file="$RESULTS_DIR/${test_name}.json"
    
    local url="${BASE_URL}/"
    local response
    response=$(curl -s "$url" 2>/dev/null || echo "ERROR")
    
    if [[ "$response" == *"ERROR"* ]]; then
        error "Failed to fetch homepage content"
        echo '{"test":"content_validation","status":"failed","error":"request_failed"}' > "$result_file"
        return 1
    fi
    
    # 验证关键内容
    local content_checks=(
        "AssayBio:上海安净生物"
        "html:HTML结构"
        "title:页面标题"
    )
    
    local results=()
    local overall_status="passed"
    
    for check in "${content_checks[@]}"; do
        local pattern="${check%%:*}"
        local description="${check##*:}"
        
        if echo "$response" | grep -qi "$pattern"; then
            log "Content check passed: $description"
            results+=('{"check":"'$pattern'","description":"'$description'","status":"passed"}')
        else
            warn "Content check failed: $description"
            results+=('{"check":"'$pattern'","description":"'$description'","status":"failed"}')
            overall_status="failed"
        fi
    done
    
    # 检查页面大小
    local content_size
    content_size=$(echo "$response" | wc -c)
    
    if [ "$content_size" -gt 1000 ]; then
        log "Content size check passed ($content_size bytes)"
        results+=('{"check":"content_size","status":"passed","size":'$content_size'}')
    else
        warn "Content size suspiciously small ($content_size bytes)"
        results+=('{"check":"content_size","status":"warning","size":'$content_size'}')
    fi
    
    # 创建测试结果
    local test_result='{"test":"content_validation","status":"'$overall_status'","timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'","results":['
    test_result+=$(IFS=','; echo "${results[*]}")
    test_result+=']}'
    
    echo "$test_result" | jq . > "$result_file"
    
    if [ "$overall_status" = "passed" ]; then
        log "Content validation passed"
        return 0
    else
        error "Content validation failed"
        return 1
    fi
}

# ====================
# 生成测试报告
# ====================
generate_report() {
    log "Generating test report..."
    local report_file="$RESULTS_DIR/test_report.json"
    local html_report="$RESULTS_DIR/test_report.html"
    
    # 收集所有测试结果
    local all_results=()
    for result_file in "$RESULTS_DIR"/*.json; do
        if [ -f "$result_file" ] && [ "$(basename "$result_file")" != "test_report.json" ]; then
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
        "test_suite": "AssayBio Automated Testing",
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
    
    # 创建HTML报告
    cat > "$html_report" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>AssayBio Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; }
        .test-result { margin: 10px 0; padding: 15px; border-radius: 5px; }
        .passed { background: #d4edda; border: 1px solid #c3e6cb; }
        .failed { background: #f8d7da; border: 1px solid #f5c6cb; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; }
        .status-badge { padding: 3px 8px; border-radius: 3px; color: white; font-weight: bold; }
        .status-passed { background: #28a745; }
        .status-failed { background: #dc3545; }
        .status-warning { background: #ffc107; color: black; }
    </style>
</head>
<body>
    <div class="header">
        <h1>AssayBio Test Report</h1>
        <p><strong>Environment:</strong> $TEST_ENVIRONMENT</p>
        <p><strong>Base URL:</strong> $BASE_URL</p>
        <p><strong>Timestamp:</strong> $(date)</p>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Overall Status:</strong> <span class="status-badge status-$overall_status">$overall_status</span></p>
        <p><strong>Total Tests:</strong> $total_tests</p>
        <p><strong>Passed:</strong> $passed_tests</p>
        <p><strong>Failed:</strong> $failed_tests</p>
        <p><strong>Warnings:</strong> $warning_tests</p>
    </div>
    
    <div class="results">
        <h2>Test Results</h2>
EOF

    for result in "${all_results[@]}"; do
        local test_name status
        test_name=$(echo "$result" | jq -r '.test')
        status=$(echo "$result" | jq -r '.status')
        
        cat >> "$html_report" << EOF
        <div class="test-result $status">
            <h3>$test_name <span class="status-badge status-$status">$status</span></h3>
            <pre>$(echo "$result" | jq .)</pre>
        </div>
EOF
    done
    
    cat >> "$html_report" << EOF
    </div>
</body>
</html>
EOF
    
    log "Test report generated:"
    info "JSON Report: $report_file"
    info "HTML Report: $html_report"
    
    # 显示摘要
    echo ""
    echo "=========================================="
    echo "Test Suite Summary"
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
    log "Starting AssayBio automated test suite"
    info "Environment: $TEST_ENVIRONMENT"
    info "Base URL: $BASE_URL"
    info "Results directory: $RESULTS_DIR"
    
    # 前置检查
    check_tools
    
    # 运行测试
    local test_functions=(
        "test_health_check"
        "test_page_accessibility"
        "test_performance"
        "test_security"
        "test_content_validation"
    )
    
    local failed_tests=0
    
    for test_func in "${test_functions[@]}"; do
        if ! $test_func; then
            ((failed_tests++))
        fi
    done
    
    # 生成报告
    if generate_report; then
        log "All tests completed successfully"
        exit 0
    else
        error "Some tests failed"
        exit 1
    fi
}

# 运行测试套件
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi