const apiGroups = {
    "관리자 설정": [
        {
            title: "모든 관리자 설정 조회",
            endpoint: "/api/mngr_sett/settings/all",
            method: "GET",
            defaultData: {}
        },
        {
            title: "관리자 설정 저장",
            endpoint: "/api/mngr_sett/settings/save",
            method: "POST",
            defaultData: {
                "mngr_settings": [
                    {
                        "sett_id": "JOB_ID_EXAMPLE",
                        "CNN_FAILR_THRS_VAL": 5
                    }
                ],
                "user_permissions": []
            }
        },
        {
            title: "관리자 설정 내보내기",
            endpoint: "/api/mngr_sett/settings/export",
            method: "GET",
            defaultData: {}
        },
        {
            title: "관리자 설정 가져오기",
            endpoint: "/api/mngr_sett/settings/import",
            method: "POST",
            defaultData: {}
        },
        {
            title: "아이콘 목록 조회",
            endpoint: "/api/mngr_sett/icons/all",
            method: "GET",
            defaultData: {}
        },
        {
            title: "아이콘 저장",
            endpoint: "/api/mngr_sett/icons/save",
            method: "POST",
            defaultData: {
                "icon_id": 1,
                "icon_cd": "🟢",
                "icon_nm": "성공",
                "icon_expl": "성공 상태",
                "icon_dsp_yn": "Y"
            }
        },
        {
            title: "아이콘 표시 여부 토글",
            endpoint: "/api/mngr_sett/icons/toggle-display",
            method: "POST",
            defaultData: {
                "icon_id": 1,
                "icon_dsp_yn": "N"
            }
        },
        {
            title: "사용자 목록 조회",
            endpoint: "/api/mngr_sett/users",
            method: "GET",
            defaultData: {}
        },
        {
            title: "사용자 승인",
            endpoint: "/api/mngr_sett/users/approve",
            method: "POST",
            defaultData: { "user_id": "testuser" }
        },
        {
            title: "사용자 거절",
            endpoint: "/api/mngr_sett/users/reject",
            method: "POST",
            defaultData: { "user_id": "testuser" }
        },
        {
            title: "비밀번호 초기화",
            endpoint: "/api/mngr_sett/users/reset-password",
            method: "POST",
            defaultData: { "user_id": "testuser" }
        },
        {
            title: "사용자 권한 업데이트",
            endpoint: "/api/mngr_sett/users/permissions",
            method: "POST",
            defaultData: {
                "user_id": "testuser",
                "menu_ids": ["dashboard", "analysis"]
            }
        }
    ],
    "아이콘 관리": [
        {
            title: "모든 아이콘 조회",
            endpoint: "/api/admin/icons/all",
            method: "GET",
            defaultData: {}
        },


























    ],
    "사용자 관리": [
        {
            title: "모든 사용자 목록 조회",
            endpoint: "/api/admin/users",
            method: "GET",
            defaultData: {}
        },
        {
            title: "사용자 승인",
            endpoint: "/api/admin/users/approve",
            method: "POST",
            defaultData: { "user_id": "testuser" }
        },
        {
            title: "사용자 거절",
            endpoint: "/api/admin/users/reject",
            method: "POST",
            defaultData: { "user_id": "testuser" }
        },
        {
            title: "사용자 삭제",
            endpoint: "/api/admin/users/delete",
            method: "POST",
            defaultData: { "user_id": "testuser" }
        },
        {
            title: "비밀번호 초기화",
            endpoint: "/api/admin/users/reset-password",
            method: "POST",
            defaultData: { "user_id": "testuser" }
        },









    ],
    "분석": [
        {
            title: "수집 성공률 추이",
            endpoint: "/api/analytics/success_rate_trend",
            method: "GET",
            defaultData: {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "job_ids": ["JOB1", "JOB2"]
            }
        },
        {
            title: "장애 코드별 비율",
            endpoint: "/api/analytics/trouble_by_code",
            method: "GET",
            defaultData: {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "job_ids": ["JOB1", "JOB2"]
            }
        },
        {
            title: "분석 요약 데이터",
            endpoint: "/api/analytics/summary",
            method: "GET",
            defaultData: {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "all_data": "false"
            }
        },
        {
            title: "분석 추이 데이터",
            endpoint: "/api/analytics/trend",
            method: "GET",
            defaultData: {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "job_ids": "JOB1,JOB2"
            }
        },
        {
            title: "분석 원천 데이터",
            endpoint: "/api/analytics/raw_data",
            method: "GET",
            defaultData: {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "job_ids": "JOB1,JOB2"
            }
        },
        {
            title: "Job ID 목록 조회",
            endpoint: "/api/analytics/job_ids",
            method: "GET",
            defaultData: {}
        },
        {
            title: "장애 코드 목록 조회",
            endpoint: "/api/analytics/error_codes",
            method: "GET",
            defaultData: {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "all_data": "false"
            }
        },
        {
            title: "장애 코드 맵 조회",
            endpoint: "/api/analytics/error_code_map",
            method: "GET",
            defaultData: {}
        },
        {
            title: "동적 차트 데이터",
            endpoint: "/api/analytics/dynamic-chart",
            method: "GET",
            defaultData: {
                "x_axis": "date",
                "y_axis": "success_rate",
                "group_by": "job_id",
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "job_ids": ["JOB1", "JOB2"]
            }
        }
    ],
    "공통 API": [
        {
            title: "최소/최대 날짜 조회",
            endpoint: "/api/min-max-dates",
            method: "GET",
            defaultData: {}
        },
        {
            title: "상세 데이터 조회",
            endpoint: "/api/detail",
            method: "GET",
            defaultData: {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "all_data": "false"
            }
        },
        {
            title: "마스터 목록 조회",
            endpoint: "/api/mst_list",
            method: "GET",
            defaultData: {}
        },
        {
            title: "Job 마스터 정보 조회",
            endpoint: "/api/job_mst_info",
            method: "GET",
            defaultData: { "job_ids": "JOB1,JOB2" }
        },
        {
            title: "이벤트 로그 조회",
            endpoint: "/api/con_hist_event_log",
            method: "GET",
            defaultData: {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "all_data": "false"
            }
        },
        {
            title: "원본 데이터 조회",
            endpoint: "/api/raw_data",
            method: "GET",
            defaultData: {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "all_data": "false"
            }
        },
        {
            title: "이벤트 로그 저장",
            endpoint: "/api/save-event-log",
            method: "POST",
            defaultData: [
                {
                    "changed_row": {
                        "job_id": "JOB_EXAMPLE",
                        "status": "CD901",
                        "start_dt": "2024-01-01 10:00:00",
                        "end_dt": "2024-01-01 10:05:00",
                        "rqs_info": "총 요청 수: 100, 실패: 0"
                    }
                }
            ]
        }
    ],
    "인증": [
        {
            title: "로그인",
            endpoint: "/login",
            method: "POST",
            defaultData: {
                "user_id": "admin",
                "password": "password"
            }
        },
        {
            title: "로그아웃",
            endpoint: "/logout",
            method: "GET",
            defaultData: {}
        },
        {
            title: "회원가입",
            endpoint: "/register",
            method: "POST",
            defaultData: {
                "user_id": "newuser",
                "password": "newpassword123!",
                "password_confirm": "newpassword123!"
            }
        },
        {
            title: "비밀번호 변경",
            endpoint: "/change_password",
            method: "POST",
            defaultData: {
                "current_password": "oldpassword",
                "new_password": "newpassword123!",
                "confirm_password": "newpassword123!"
            }
        },






    ],
    "대시보드": [
        {
            title: "대시보드 요약 데이터",
            endpoint: "/api/dashboard/summary",
            method: "GET",
            defaultData: {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "all_data": "true"
            }
        },
        {
            title: "대시보드 최소/최대 날짜",
            endpoint: "/api/dashboard/min-max-dates",
            method: "GET",
            defaultData: {}
        },
        {
            title: "이벤트 로그 조회",
            endpoint: "/api/dashboard/event-log",
            method: "GET",
            defaultData: {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "all_data": "false"
            }
        }
    ],
    "데이터 명세서": [















































    ],
    "Jandi 연동": [

























    ],
    "매핑 관리": [
        {
            title: "모든 매핑 정보 조회",
            endpoint: "/mapping/api/all",
            method: "GET",
            defaultData: {}
        },
        {
            title: "매핑되지 않은 컬럼 조회",
            endpoint: "/mapping/api/unmapped",
            method: "GET",
            defaultData: {}
        },
        {
            title: "새 매핑 추가",
            endpoint: "/mapping/api/add",
            method: "POST",
            defaultData: {
                "new_tbl_nm": "NEW_TABLE",
                "new_col_nm": "NEW_COLUMN",
                "old_tbl_nm": "OLD_TABLE",
                "old_col_nm": "OLD_COLUMN"
            }
        },
        {
            title: "매핑 업데이트",
            endpoint: "/mapping/api/update",
            method: "POST",
            defaultData: {
                "mapp_id": 1,
                "new_tbl_nm": "UPDATED_TABLE",
                "new_col_nm": "UPDATED_COLUMN"
            }
        },






    ]
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = apiGroups;
}

export { apiGroups };
