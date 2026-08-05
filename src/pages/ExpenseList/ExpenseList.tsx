import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";

export default function BasicTables() {
  return (
    <>
      <PageMeta
        title="Expenses | Expenshie"
        description="Browse, filter and manage every expense recorded in your household."
      />
      <PageBreadcrumb pageTitle="Expense List" />
      <div className="space-y-6">
        <BasicTableOne />
      </div>
    </>
  );
}
