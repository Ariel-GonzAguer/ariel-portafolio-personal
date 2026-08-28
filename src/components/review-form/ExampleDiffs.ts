/**
 * Diffs de ejemplo precargados para el AI Code Reviewer.
 *
 * Cada uno contiene bugs reales y sutiles que el reviewer debería encontrar.
 * Sirven para demos en vivo y para que el usuario pruebe la herramienta
 * sin necesidad de tener un diff propio a mano.
 *
 * Todos son unified diffs válidos (con headers --- a/ y +++ b/).
 */

export interface ExampleDiff {
  id: string;
  label: string;
  description: string;
  diff: string;
}

const TS_N1_INPUT: ExampleDiff = {
  id: 'ts-n1-and-issues',
  label: 'TypeScript: N+1 y label faltante',
  description:
    'Loop con query por iteración y un input sin label asociado. Un finding de performance y uno de accesibilidad.',
  diff: `--- a/src/components/users/UserList.tsx
+++ b/src/components/users/UserList.tsx
@@ -1,15 +1,22 @@
-import { useState } from 'react';
+import { useState, useEffect } from 'react';
+import { db } from '../../lib/firebase';

 interface User {
   id: string;
   name: string;
 }

 export function UserList({ ids }: { ids: string[] }) {
   const [users, setUsers] = useState<User[]>([]);
-  // ...carga inicial
+  useEffect(() => {
+    const load = async () => {
+      const results: User[] = [];
+      for (const id of ids) {
+        const snap = await db.collection('users').doc(id).get();
+        results.push({ id, name: snap.data()?.name as string });
+      }
+      setUsers(results);
+    };
+    void load();
+  }, [ids]);

   return (
     <ul>
-      {users.map((u) => <li key={u.id}>{u.name}</li>)}
+      {users.map((u) => (
+        <li key={u.id}>
+          <input type="checkbox" /> {u.name}
+        </li>
+      ))}
     </ul>
   );
 }`,
};

const PY_SQL_INJECTION: ExampleDiff = {
  id: 'py-sql-injection',
  label: 'Python: SQL injection y eval',
  description:
    'Concatenación directa en SQL y un eval() inseguro. Dos findings de security.',
  diff: `--- a/api/users.py
+++ b/api/users.py
@@ -1,12 +1,18 @@
 from flask import request, jsonify
+import psycopg2

 def search_users(conn):
     query = request.args.get('q', '')
-    # buscar por nombre
+    sql = f"SELECT id, name, email FROM users WHERE name LIKE '%{query}%'"
+    cur = conn.cursor()
+    cur.execute(sql)
+    return jsonify(cur.fetchall())

 def run_admin_action(payload):
-    # ejecutar acción
+    action = payload.get('action')
+    args = payload.get('args', [])
+    result = eval(f"admin.{action}(*{args})")
+    return jsonify({'result': str(result)})`,
};

const CSS_A11Y_AND_PERF: ExampleDiff = {
  id: 'css-a11y-and-perf',
  label: 'CSS: contraste bajo y div clickable',
  description:
    'Botón con contraste insuficiente y un div con onClick sin role ni teclado. Dos findings de accessibility.',
  diff: `--- a/src/components/Button.module.css
+++ b/src/components/Button.module.css
@@ -1,8 +1,18 @@
 .button {
-  background: #777;
-  color: #999;
+  background: linear-gradient(45deg, #ff00ff, #00ffff);
+  color: rgba(255, 255, 255, 0.4);
   padding: 12px 24px;
   border: none;
   cursor: pointer;
 }
+
+.card {
+  padding: 16px;
+  background: white;
+}
+
+.clickable {
+  cursor: pointer;
+  transition: transform 0.3s ease-in-out;
+}`,
};

export const EXAMPLE_DIFFS: ExampleDiff[] = [
  TS_N1_INPUT,
  PY_SQL_INJECTION,
  CSS_A11Y_AND_PERF,
];
