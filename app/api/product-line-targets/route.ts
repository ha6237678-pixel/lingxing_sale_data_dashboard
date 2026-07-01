import { getLatestProductLineTargetDate, getProductLineTargetRankings } from "@/lib/queries/product-line-targets";
import { displayError } from "@/lib/services/errors";
import { parseFilters } from "@/lib/utils/date";
import { format, startOfMonth } from "date-fns";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filters = parseFilters(params);
    const latestDate = await getLatestProductLineTargetDate();

    if (latestDate && !params.endDate) {
      filters.endDate = latestDate;
      if (!params.startDate) {
        filters.startDate = format(startOfMonth(new Date(`${latestDate}T00:00:00`)), "yyyy-MM-dd");
      }
    }

    const rankings = await getProductLineTargetRankings(filters);

    return NextResponse.json({ filters, latestDate, rankings });
  } catch (error) {
    return NextResponse.json({ message: displayError(error) }, { status: 500 });
  }
}
