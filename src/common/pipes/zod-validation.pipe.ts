import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import type { ZodSchema } from "zod";


@Injectable()
export class ZodValidationPipe implements PipeTransform{
      constructor(private readonly schema: ZodSchema) {}

      transform(value: unknown) {
        const parsed = this.schema.safeParse(value);

        if(parsed.success) return parsed.data;

        const errors = parsed.error.issues.map((i)=>({
            path: i.path.join("."),
            message: i.message,
        }))

        throw new BadRequestException({
            message : "Validation failed",
            errors,
        });
          
      }

}