import { NextRequest, NextResponse } from "next/server";
import { getStateFormInfo, getSupportedStates, isStateSupported } from "@/lib/data/stateHealthcareProxyForms";

// GET /api/forms?state=FL
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const stateCode = searchParams.get("state");

  // If no state specified, return list of supported states
  if (!stateCode) {
    return NextResponse.json({
      supportedStates: getSupportedStates(),
      message: "Provide ?state=XX to get state-specific form information"
    });
  }

  // Get state form info
  const formInfo = getStateFormInfo(stateCode);

  if (!formInfo) {
    return NextResponse.json(
      {
        error: "State not supported",
        stateCode,
        supportedStates: getSupportedStates()
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    stateCode: stateCode.toUpperCase(),
    formInfo
  });
}
