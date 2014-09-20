
        /* ///////////////////////////////////////////////////////////
             M A T H    U T I L I T I E S    F U N C T I O N S
        ************************************************************
        ////////////////////////////////////////////////////////// */

        function AngleBetweenLineAndPointF(ptLineStart, ptLineEnd, ptOutSide) {
            var da = this.GetDistBetweenPointFs(ptLineStart, ptLineEnd);
            var db = this.GetDistBetweenPointFs(ptLineStart, ptOutSide);
            var dc = this.GetDistBetweenPointFs(ptLineEnd, ptOutSide);
            return Math.acos((db * db + dc * dc - da * da) / (2 * db * dc)) * (180 / Math.PI);
        }

        function GetDistBetweenPointFs(pt1, pt2) {
            return Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));
        }

        function GetvarOnLineUsingDistance(ptfLineStart, ptfLineEnd, dDistance, dOffsetAngle, bDistFromStartPt) {
            var dLineLength = this.GetDistBetweenPointFs(ptfLineStart, ptfLineEnd);
            var u = dDistance / dLineLength;

            if (!bDistFromStartPt) {
                u = 1 - u;
            }
            var ptOnLine = this.GetvarOnLineUsing_U_Value(ptfLineStart, ptfLineEnd, u);
            return this.GetRotatedvar(ptOnLine, bDistFromStartPt ? ptfLineStart : ptfLineEnd, dOffsetAngle);
        }

        function GetvarOnLineUsing_U_Value(ptLineStart, ptLineEnd, u) {
            var x1 = ptLineStart.x;
            var y1 = ptLineStart.y;
            var x2 = ptLineEnd.x;
            var y2 = ptLineEnd.y;
            var px = x2 - x1;
            var py = y2 - y1;

            if (px == 0 && py == 0) {
                return ptLineStart;
            }

            var x = x1 + u * px;
            var y = y1 + u * py;
            return { x: x, y: y };
        }

        function GetRotatedvar(ptf, cptf, dRotationInDegree) {
            var outPt = { x: 0, y: 0 };
            var rotationInRad = dRotationInDegree * Math.PI / 180;
            outPt.x = ((Math.cos(rotationInRad) * (ptf.x - cptf.x)) - (Math.sin(rotationInRad) * (ptf.y - cptf.y))) + cptf.x;
            outPt.y = ((Math.sin(rotationInRad) * (ptf.x - cptf.x)) + (Math.cos(rotationInRad) * (ptf.y - cptf.y))) + cptf.y;
            return outPt;
        }

        function getAngleWithXAxis(point, refPoint) {
            var x1 = refPoint.x,
                y1 = refPoint.y,
                x2 = point.x,
                y2 = point.y,
                dDiffX = x2 - x1,
                dDiffY = y2 - y1;

            if (dDiffX == 0 && dDiffY == 0) {
                return 360;
            }

            var dDist = Math.sqrt(dDiffX * dDiffX + dDiffY * dDiffY),
                dAngle = Math.acos(Math.abs(dDiffX) / dDist) * 180 / Math.PI;
            dAngle = (x2 < x1 && y2 >= y1) ? 180 - dAngle : dAngle;
            dAngle = (x2 <= x1 && y2 < y1) ? 180 + dAngle : dAngle;
            dAngle = (x2 > x1 && y2 < y1) ? 360 - dAngle : dAngle;
            return dAngle;
        }


        function ReflectvarToTheLine(ptToReflect, ptLineStart, ptLineEnd) {
            var ptReflected = { x: 0, y: 0 };
            var ptNormal = this.GetNormalvar(ptToReflect, ptLineStart, ptLineEnd);
            var dNormalDistance = this.GetDistBetweenvars(ptNormal, ptToReflect);
            ptReflected = this.GetvarOnLineUsingDistance(ptNormal, ptToReflect, -dNormalDistance, 0, true);
            return ptReflected;
        }

        function GetNormalvar(ptNotOnLine, ptLineStart, ptLineEnd) {
            var x3 = ptNotOnLine.x;
            var y3 = ptNotOnLine.y;
            var x1 = ptLineStart.x;
            var y1 = ptLineStart.y;
            var x2 = ptLineEnd.x;
            var y2 = ptLineEnd.y;
            var px = x2 - x1;
            var py = y2 - y1;
            var iLineLength = (px * px) + (py * py);
            var u = ((x3 - x1) * px + (y3 - y1) * py) / iLineLength;
            var x = (x1 + u * px);
            var y = (y1 + u * py);
            return { x: x, y: y };
        }

        function GetDistBetweenvars(pt1, pt2) {
            return Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));
        }


        function GetInterSectionOfTwoLines(ptStartLine_1, ptEndLine_1, ptStartLine_2, ptEndLine_2, btwnLine1, btwnLine2) {
            var x1 = ptStartLine_1.x;
            var y1 = ptStartLine_1.y;

            var p = ptStartLine_2.x;
            var q = ptStartLine_2.y;

            var dx1 = (ptStartLine_1.x - ptEndLine_1.x);
            var dy1 = (ptStartLine_1.y - ptEndLine_1.y);

            var dx2 = (ptStartLine_2.x - ptEndLine_2.x);
            var dy2 = (ptStartLine_2.y - ptEndLine_2.y);

            if ((dx1 == 0 && dy1 == 0) || (dx2 == 0 && dy2 == 0)) {
                return null;
            }

            var m2;
            m1 = (dx1 == 0) ? 1000000 : dy1 / dx1;
            m2 = (dx2 == 0) ? 1000000 : dy2 / dx2;
            if (m1 == m2) {
                return null;
            }

            var x = ((m1 * x1 - y1) - (m2 * p - q)) / (m1 - m2);
            var y = (m1 * (x - x1) + y1);

            x = (dx1 == 0) ? x1 : ((dx2 == 0) ? p : x);
            y = (dy1 == 0) ? y1 : ((dy2 == 0) ? q : y);

            var ptIntersection = { x: x, y: y };
            var flag = true;
            if (btwnLine1) {
                var u = this.Get_LineU_ForPointF(ptStartLine_1, ptEndLine_1, ptIntersection);
                if (u < 0 || u > 1) {
                    flag = false;
                }
            }
            if (btwnLine2) {
                var u = this.Get_LineU_ForPointF(ptStartLine_2, ptEndLine_2, ptIntersection);
                if (u < 0 || u > 1) {
                    flag = false;
                }
            }
            return (flag ? ptIntersection : null);
        }

        function Get_LineU_ForPointF(ptLineStart, ptLineEnd, ptOnLine) {
            var x1 = ptLineStart.x;
            var y1 = ptLineStart.y;
            var x2 = ptLineEnd.x;
            var y2 = ptLineEnd.y;
            var x3 = ptOnLine.x;
            var y3 = ptOnLine.y;

            var px = x2 - x1;
            var py = y2 - y1;

            if (px == 0 && py == 0) {
                return 0;
            }

            var iLineLength = (px * px) + (py * py);
            var u = ((x3 - x1) * px + (y3 - y1) * py) / iLineLength;
            return u;
        }
  
