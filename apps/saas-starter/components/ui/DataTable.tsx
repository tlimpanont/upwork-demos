import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

export type Column<T> = {
  key: string;
  header: string;
  width?: number | string;
  align?: "left" | "right" | "center";
  cell: (row: T) => React.ReactNode;
};

type Props<T> = {
  rows: ReadonlyArray<T>;
  columns: ReadonlyArray<Column<T>>;
  rowKey: (row: T) => string;
  empty?: { title: string; subtitle?: string; action?: React.ReactNode };
};

export default function DataTable<T>({ rows, columns, rowKey, empty }: Props<T>) {
  if (rows.length === 0 && empty) {
    return (
      <Paper variant="outlined" sx={{ borderRadius: 3 }}>
        <Box sx={{ textAlign: "center", py: 6, px: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {empty.title}
          </Typography>
          {empty.subtitle ? (
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              {empty.subtitle}
            </Typography>
          ) : null}
          {empty.action ? <Box sx={{ mt: 2 }}>{empty.action}</Box> : null}
        </Box>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell
                key={col.key}
                align={col.align ?? "left"}
                sx={{ width: col.width, color: "text.secondary" }}
              >
                {col.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={rowKey(row)} hover>
              {columns.map((col) => (
                <TableCell key={col.key} align={col.align ?? "left"}>
                  {col.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
