#pragma once

#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct sqlite3 sqlite3;
typedef struct sqlite3_stmt sqlite3_stmt;

#define SQLITE_OK           0
#define SQLITE_ERROR        1
#define SQLITE_ROW          100
#define SQLITE_DONE         101
#define SQLITE_INTEGER      1
#define SQLITE_FLOAT        2
#define SQLITE_TEXT         3
#define SQLITE_BLOB         4
#define SQLITE_NULL         5
#define SQLITE_OPEN_READWRITE 0x00000002
#define SQLITE_OPEN_CREATE    0x00000004

typedef int (*sqlite3_callback)(void*, int, char**, char**);

SQLITE_API int sqlite3_open(const char *filename, sqlite3 **ppDb);
SQLITE_API int sqlite3_open_v2(const char *filename, sqlite3 **ppDb, int flags, const char *zVfs);
SQLITE_API int sqlite3_close(sqlite3 *db);
SQLITE_API int sqlite3_exec(sqlite3 *db, const char *sql, sqlite3_callback callback, void *data, char **errmsg);
SQLITE_API int sqlite3_prepare_v2(sqlite3 *db, const char *zSql, int nByte, sqlite3_stmt **ppStmt, const char **pzTail);
SQLITE_API int sqlite3_step(sqlite3_stmt *pStmt);
SQLITE_API int sqlite3_finalize(sqlite3_stmt *pStmt);
SQLITE_API int sqlite3_reset(sqlite3_stmt *pStmt);
SQLITE_API int sqlite3_bind_int(sqlite3_stmt *pStmt, int idx, int val);
SQLITE_API int sqlite3_bind_int64(sqlite3_stmt *pStmt, int idx, long long val);
SQLITE_API int sqlite3_bind_double(sqlite3_stmt *pStmt, int idx, double val);
SQLITE_API int sqlite3_bind_text(sqlite3_stmt *pStmt, int idx, const char *val, int n, void(*del)(void*));
SQLITE_API int sqlite3_bind_null(sqlite3_stmt *pStmt, int idx);
SQLITE_API int sqlite3_column_count(sqlite3_stmt *pStmt);
SQLITE_API int sqlite3_column_type(sqlite3_stmt *pStmt, int iCol);
SQLITE_API int sqlite3_column_int(sqlite3_stmt *pStmt, int iCol);
SQLITE_API long long sqlite3_column_int64(sqlite3_stmt *pStmt, int iCol);
SQLITE_API double sqlite3_column_double(sqlite3_stmt *pStmt, int iCol);
SQLITE_API const unsigned char *sqlite3_column_text(sqlite3_stmt *pStmt, int iCol);
SQLITE_API const char *sqlite3_column_name(sqlite3_stmt *pStmt, int iCol);
SQLITE_API long long sqlite3_last_insert_rowid(sqlite3 *db);
SQLITE_API int sqlite3_changes(sqlite3 *db);
SQLITE_API const char *sqlite3_errmsg(sqlite3 *db);
SQLITE_API int sqlite3_errcode(sqlite3 *db);
SQLITE_API void sqlite3_free(void *p);

#define SQLITE_STATIC      ((void(*)(void*))0)
#define SQLITE_TRANSIENT   ((void(*)(void*))-1)

#ifdef __cplusplus
}
#endif
