import { getTables } from "@/lib/actions/tables";
import { TableMapBuilder } from "@/components/admin/tables/table-map-builder";

export default async function AdminTablesPage() {
  const result = await getTables();
  const initialTables = result.success ? result.data : [];

  return <TableMapBuilder initialTables={initialTables} />;
}
