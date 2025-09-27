import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { WindowData } from "@/types/general";

import Image from "next/image";
import imageLoader from "@/util/imageLoader";

export default function WindowCard({window}: {window: WindowData}) {
    return (
        <Card key={window._id}>
            <CardHeader>
                <CardTitle>{window.description || "No description available"}</CardTitle>
                <CardDescription>
                    {new Date(window.createdAt * 1000).toLocaleString()}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Image
                    loader={imageLoader}
                    src={window.imageUrl}
                    alt={window.description || "Ventana"}
                    className="w-full h-auto rounded mb-4"
                    width={400}
                    height={300}
                />
                <h3 className="w-full text-center">Structured Data</h3>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Field</TableHead>
                            <TableHead>Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(window.structured_data || {}).map(([key, value]) => (
                            <TableRow key={window._id + key}>
                                <TableCell className="font-medium capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </TableCell>
                                <TableCell>{value || "N/A"}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    _id: {window._id.substring(0, 8)}...
                </p>
                {window.isDuplicate && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                        Duplicate
                    </span>
                )}
            </CardFooter>
        </Card>
    )
}